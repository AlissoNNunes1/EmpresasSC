// Regras puras de endereço: CEP ↔ logradouro. Sem rede; a consulta fica em consulta.ts.
import { normalizarTexto, similaridadeTexto } from "../empresa/similaridade";

export const MUNICIPIO_PADRAO = { nome: "São Cristóvão", uf: "SE", ibge: "2806701" } as const;

export type EnderecoCep = { cep: string; logradouro: string; bairro: string; municipio: string; uf: string };

export type EntradaEndereco = { cep: string; logradouro: string; bairro: string };

export type BuscadoresEndereco = {
  porCep(cep: string): Promise<EnderecoCep | null>;
  porLogradouro(entrada: { logradouro: string; bairro: string }): Promise<EnderecoCep | null>;
};

export type EnderecoCompletado = EntradaEndereco & { origem: "CEP" | "LOGRADOURO" | null };

// Tipo de via não diferencia o nome ("Rua Ivo do Prado" e "Avenida Ivo do Prado" são a mesma via).
const TIPOS_DE_VIA = new Set(["rua", "r", "avenida", "av", "travessa", "tv", "estrada", "est", "praca", "pca", "alameda", "al", "rodovia", "rod", "beco", "largo", "vila"]);

// Marcadores de "sem número" e números de porta, removidos do fim do nome da via.
const MARCADORES_SEM_NUMERO = new Set(["s", "n", "sn"]);

const PLACEHOLDER_VAZIO = "Não informado";

export function normalizarCep(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (!digitos || digitos.length > 8 || /^0+$/.test(digitos)) return "";
  return digitos.padStart(8, "0");
}

// Resultado de fora do município é descartado: endereço de outra cidade não entra no cadastro.
export function pertenceAoMunicipioPadrao(endereco: Pick<EnderecoCep, "municipio" | "uf">): boolean {
  return endereco.uf.trim().toUpperCase() === MUNICIPIO_PADRAO.uf
    && normalizarTexto(endereco.municipio) === normalizarTexto(MUNICIPIO_PADRAO.nome);
}

export function estaVazio(valor: string): boolean {
  const limpo = valor.trim();
  return limpo === "" || limpo === PLACEHOLDER_VAZIO;
}

// "Rua Ivo do Prado, 25" -> "Ivo do Prado". Mantém acentos (a consulta exige o nome original).
export function nomeDaViaParaBusca(logradouro: string): string {
  const palavras = (logradouro.split(",")[0] ?? "").trim().split(/\s+/).filter(Boolean);

  while (palavras.length > 1 && TIPOS_DE_VIA.has(normalizarTexto(palavras[0]))) palavras.shift();
  while (palavras.length > 1 && ehMarcadorDeNumero(palavras[palavras.length - 1])) palavras.pop();

  return palavras.length === 1 && TIPOS_DE_VIA.has(normalizarTexto(palavras[0])) ? "" : palavras.join(" ");
}

function ehMarcadorDeNumero(palavra: string): boolean {
  const normalizada = normalizarTexto(palavra);
  return MARCADORES_SEM_NUMERO.has(normalizada) || /^\d+[a-z]?$/.test(normalizada);
}

export function chaveDaVia(logradouro: string): string {
  return normalizarTexto(nomeDaViaParaBusca(logradouro));
}

/**
 * Escolhe o CEP de uma via entre os candidatos da busca por nome.
 * Com bairro informado, exige bairro parecido. Sem bairro, só aceita CEP único.
 * Ambíguo retorna null: é melhor não preencher do que preencher errado.
 */
export function escolherCandidatoPorLogradouro(
  candidatos: EnderecoCep[],
  logradouro: string,
  bairro: string,
): EnderecoCep | null {
  const alvo = chaveDaVia(logradouro);
  if (!alvo) return null;

  const mesmaVia = candidatos.filter((candidato) => similaridadeTexto(chaveDaVia(candidato.logradouro), alvo) >= 0.9);
  if (mesmaVia.length === 0) return null;

  if (!estaVazio(bairro)) {
    const bairroAlvo = normalizarTexto(bairro);
    return mesmaVia.find((candidato) => similaridadeTexto(normalizarTexto(candidato.bairro), bairroAlvo) >= 0.8) ?? null;
  }

  const cepsDistintos = new Set(mesmaVia.map((candidato) => candidato.cep));
  return cepsDistintos.size === 1 ? mesmaVia[0] : null;
}

/**
 * Completa os campos vazios de um endereço. Nunca sobrescreve valor já informado.
 * Por CEP: preenche logradouro e bairro. Sem CEP, por logradouro: preenche o CEP.
 */
export async function completarEndereco(
  entrada: EntradaEndereco,
  buscadores: BuscadoresEndereco,
): Promise<EnderecoCompletado> {
  const cep = normalizarCep(entrada.cep);

  if (cep) {
    const encontrado = await buscadores.porCep(cep);
    if (!encontrado) return { ...entrada, cep, origem: null };

    const logradouro = estaVazio(entrada.logradouro) && !estaVazio(encontrado.logradouro) ? encontrado.logradouro : entrada.logradouro;
    const bairro = estaVazio(entrada.bairro) && !estaVazio(encontrado.bairro) ? encontrado.bairro : entrada.bairro;
    const alterou = logradouro !== entrada.logradouro || bairro !== entrada.bairro;
    return { cep, logradouro, bairro, origem: alterou ? "CEP" : null };
  }

  if (estaVazio(entrada.logradouro)) return { ...entrada, origem: null };

  const encontrado = await buscadores.porLogradouro({ logradouro: entrada.logradouro, bairro: entrada.bairro });
  if (!encontrado) return { ...entrada, origem: null };

  const bairro = estaVazio(entrada.bairro) && !estaVazio(encontrado.bairro) ? encontrado.bairro : entrada.bairro;
  return { cep: encontrado.cep, logradouro: entrada.logradouro, bairro, origem: "LOGRADOURO" };
}
