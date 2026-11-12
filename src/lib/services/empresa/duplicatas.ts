// Detecção de possíveis duplicatas: aponta pares de empresas que provavelmente são a mesma.
// Só reporta. Não bloqueia nem mescla: quem decide é o usuário na prévia da importação.
import { normalizarTexto, similaridadeTexto } from "./similaridade";

export type RegistroComparavel = {
  ref: string;
  cnpj: string;
  nome: string;
  nomeFantasia?: string | null;
  telefone?: string;
  logradouro?: string;
};

export type PossivelDuplicata = {
  a: { ref: string; nome: string; cnpj: string };
  b: { ref: string; nome: string; cnpj: string };
  score: number;
  motivos: string[];
};

// Palavras que não distinguem uma empresa de outra ("Restaurante da Ana" x "Restaurante Ana").
const PALAVRAS_IRRELEVANTES = new Set(["de", "da", "do", "das", "dos", "e", "ltda", "me", "epp", "eireli", "mei"]);

// Regras: nome idêntico basta; nome só parecido precisa de telefone ou endereço parecidos.
// Nome parecido sozinho não basta: filiais ("Mercearia X LA" x "Mercearia X MD") têm nome quase igual.
const NOME_MINIMO_PARECIDO = 0.6;
const ENDERECO_PARECIDO = 0.8;

const PESO_NOME = 0.6;
const PESO_TELEFONE = 0.2;
const PESO_ENDERECO = 0.2;

function nomesComparaveis(registro: RegistroComparavel): string[] {
  return [registro.nome, registro.nomeFantasia ?? ""]
    .map((nome) => normalizarTexto(nome).split(" ").filter((p) => p && !PALAVRAS_IRRELEVANTES.has(p)).join(" "))
    .filter(Boolean);
}

// Fração das palavras menores que aparecem na outra: "Lar Azul" dentro de "Restaurante Lar Azul" = 1.
// Exige pelo menos duas palavras em comum: uma só (ex.: "Churrascaria") é genérica demais.
function sobreposicaoDePalavras(x: string, y: string): number {
  const palavrasX = new Set(x.split(" ").filter((p) => p.length >= 3));
  const palavrasY = new Set(y.split(" ").filter((p) => p.length >= 3));
  if (palavrasX.size === 0 || palavrasY.size === 0) return 0;

  let compartilhadas = 0;
  for (const palavra of palavrasX) if (palavrasY.has(palavra)) compartilhadas++;
  if (compartilhadas < 2) return 0;
  return compartilhadas / Math.min(palavrasX.size, palavrasY.size);
}

type ComparacaoDeNomes = { similaridade: number; identico: boolean };

function compararNomes(a: RegistroComparavel, b: RegistroComparavel): ComparacaoDeNomes {
  let similaridade = 0;
  let identico = false;
  for (const x of nomesComparaveis(a)) {
    for (const y of nomesComparaveis(b)) {
      if (x === y) identico = true;
      similaridade = Math.max(similaridade, similaridadeTexto(x, y), sobreposicaoDePalavras(x, y));
    }
  }
  return { similaridade, identico };
}

// Últimos 8 dígitos ignoram DDD e nono dígito, que variam entre cadastros.
function ultimosDigitosDoTelefone(telefone = ""): string {
  return telefone.replace(/\D/g, "").slice(-8);
}

function telefonesIguais(a: RegistroComparavel, b: RegistroComparavel): boolean {
  const telefoneA = ultimosDigitosDoTelefone(a.telefone);
  return telefoneA.length === 8 && telefoneA === ultimosDigitosDoTelefone(b.telefone);
}

function similaridadeEndereco(a: RegistroComparavel, b: RegistroComparavel): number {
  const enderecoA = normalizarTexto(a.logradouro ?? "");
  const enderecoB = normalizarTexto(b.logradouro ?? "");
  return enderecoA && enderecoB ? similaridadeTexto(enderecoA, enderecoB) : 0;
}

function percentual(valor: number): string {
  return `${Math.round(valor * 100)}%`;
}

function resumo(registro: RegistroComparavel) {
  return { ref: registro.ref, nome: registro.nome, cnpj: registro.cnpj };
}

function avaliarPar(a: RegistroComparavel, b: RegistroComparavel): PossivelDuplicata | null {
  // CNPJ igual é a mesma empresa, tratada como atualização e não como duplicata.
  if (a.cnpj && a.cnpj === b.cnpj) return null;

  const nomes = compararNomes(a, b);
  if (nomes.similaridade < NOME_MINIMO_PARECIDO) return null;

  const telefone = telefonesIguais(a, b);
  const endereco = similaridadeEndereco(a, b);
  const enderecoParecido = endereco >= ENDERECO_PARECIDO;

  if (!nomes.identico && !telefone && !enderecoParecido) return null;

  const motivos = [nomes.identico ? "nome igual" : `nome parecido (${percentual(nomes.similaridade)})`];
  if (telefone) motivos.push("mesmo telefone");
  if (enderecoParecido) motivos.push(`endereço parecido (${percentual(endereco)})`);

  const score = PESO_NOME * nomes.similaridade + PESO_TELEFONE * (telefone ? 1 : 0) + PESO_ENDERECO * endereco;
  return { a: resumo(a), b: resumo(b), score: Math.round(score * 100) / 100, motivos };
}

// Blocking: só compara registros que dividem uma palavra do nome ou o telefone.
// Evita comparar cada linha com todo o banco. Erro de digitação na primeira palavra pode escapar.
function chavesDeBloqueio(registro: RegistroComparavel): string[] {
  const chaves = new Set<string>();
  for (const nome of nomesComparaveis(registro)) {
    for (const palavra of nome.split(" ")) {
      if (palavra.length >= 3) chaves.add(`nome:${palavra}`);
    }
  }
  const telefone = ultimosDigitosDoTelefone(registro.telefone);
  if (telefone.length === 8) chaves.add(`telefone:${telefone}`);
  return [...chaves];
}

/**
 * Compara os registros novos entre si e com os existentes.
 * Pares com CNPJ igual são ignorados (são atualizações, não duplicatas).
 */
export function encontrarPossiveisDuplicatas(
  novos: RegistroComparavel[],
  existentes: RegistroComparavel[],
): PossivelDuplicata[] {
  const todos = [...novos, ...existentes];
  const indice = new Map<string, number[]>();

  todos.forEach((registro, idx) => {
    for (const chave of chavesDeBloqueio(registro)) {
      indice.set(chave, [...(indice.get(chave) ?? []), idx]);
    }
  });

  const encontrados: PossivelDuplicata[] = [];

  novos.forEach((registro, i) => {
    const candidatos = new Set<number>();
    for (const chave of chavesDeBloqueio(registro)) {
      for (const idx of indice.get(chave) ?? []) candidatos.add(idx);
    }

    for (const j of candidatos) {
      // Pares novo-novo são avaliados uma vez (j > i); novo-existente sempre.
      const ehNovo = j < novos.length;
      if (j === i || (ehNovo && j < i)) continue;

      const par = avaliarPar(registro, todos[j]);
      if (par) encontrados.push(par);
    }
  });

  return encontrados.sort((x, y) => y.score - x.score);
}
