// Consulta pública de endereços (sem API key). ViaCEP primeiro; BrasilAPI como fallback por CEP.
// Falha de rede ou CEP inexistente vira null: a importação e o cadastro nunca quebram por causa disso.
import {
  chaveDaVia,
  escolherCandidatoPorLogradouro,
  MUNICIPIO_PADRAO,
  nomeDaViaParaBusca,
  normalizarCep,
  pertenceAoMunicipioPadrao,
  type BuscadoresEndereco,
  type EnderecoCep,
} from "./regras";

const TIMEOUT_MS = 5000;

async function getJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

type ViaCepRegistro = { cep?: string; logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: unknown };
type BrasilApiCep = { cep?: string; street?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null };

function deViaCep(dado: unknown): EnderecoCep | null {
  if (!dado || typeof dado !== "object") return null;
  const registro = dado as ViaCepRegistro;
  if (registro.erro) return null;

  return {
    cep: normalizarCep(registro.cep ?? ""),
    logradouro: registro.logradouro ?? "",
    bairro: registro.bairro ?? "",
    municipio: registro.localidade ?? "",
    uf: registro.uf ?? "",
  };
}

function deBrasilApi(dado: unknown): EnderecoCep | null {
  if (!dado || typeof dado !== "object") return null;
  const registro = dado as BrasilApiCep;

  return {
    cep: normalizarCep(registro.cep ?? ""),
    logradouro: registro.street ?? "",
    bairro: registro.neighborhood ?? "",
    municipio: registro.city ?? "",
    uf: registro.state ?? "",
  };
}

function dentroDoMunicipio(endereco: EnderecoCep | null): EnderecoCep | null {
  return endereco && pertenceAoMunicipioPadrao(endereco) ? endereco : null;
}

/**
 * CEP → endereço do município padrão. ViaCEP costuma ter menos logradouros para cidades pequenas;
 * BrasilAPI complementa. CEP de outra cidade retorna null.
 */
export async function buscarPorCep(cep: string): Promise<EnderecoCep | null> {
  const viaCep = dentroDoMunicipio(deViaCep(await getJson(`https://viacep.com.br/ws/${cep}/json/`)));
  if (viaCep?.logradouro) return viaCep;

  const brasilApi = dentroDoMunicipio(deBrasilApi(await getJson(`https://brasilapi.com.br/api/cep/v2/${cep}`)));
  if (brasilApi?.logradouro) return brasilApi;

  return viaCep ?? brasilApi;
}

/** Logradouro → candidatos (CEPs) no município padrão. ViaCEP exige pelo menos 3 caracteres. */
async function buscarCandidatosPorNome(logradouro: string): Promise<EnderecoCep[]> {
  const nome = nomeDaViaParaBusca(logradouro);
  if (nome.length < 3) return [];

  const { uf, nome: municipio } = MUNICIPIO_PADRAO;
  const lista = await getJson(`https://viacep.com.br/ws/${uf}/${encodeURIComponent(municipio)}/${encodeURIComponent(nome)}/json/`);
  if (!Array.isArray(lista)) return [];

  return lista
    .map(deViaCep)
    .filter((endereco): endereco is EnderecoCep => endereco !== null && pertenceAoMunicipioPadrao(endereco));
}

/**
 * Buscadores com cache para uma execução (ex.: uma importação inteira).
 * Cada CEP e cada nome de via é consultado uma única vez.
 */
export function criarBuscadoresDeEnderecos(): BuscadoresEndereco {
  const cachePorCep = new Map<string, EnderecoCep | null>();
  const cachePorVia = new Map<string, EnderecoCep[]>();

  return {
    async porCep(cep) {
      if (!cachePorCep.has(cep)) cachePorCep.set(cep, await buscarPorCep(cep));
      return cachePorCep.get(cep) ?? null;
    },

    async porLogradouro({ logradouro, bairro }) {
      const chave = chaveDaVia(logradouro);
      if (!chave) return null;

      if (!cachePorVia.has(chave)) cachePorVia.set(chave, await buscarCandidatosPorNome(logradouro));
      return escolherCandidatoPorLogradouro(cachePorVia.get(chave) ?? [], logradouro, bairro);
    },
  };
}
