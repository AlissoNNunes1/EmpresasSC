// Similaridade de texto compartilhada entre a importação e a detecção de duplicatas.
import { distance } from "fastest-levenshtein";

// Razão 0..1 a partir da distância de edição: 1 = idêntico, 0 = nada em comum.
export function similaridadeTexto(a: string, b: string): number {
  if (a === b) return 1;
  const maiorTamanho = Math.max(a.length, b.length);
  if (maiorTamanho === 0) return 1;
  return 1 - distance(a, b) / maiorTamanho;
}

// Minúsculas, sem acento, pontuação virando espaço.
export function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
