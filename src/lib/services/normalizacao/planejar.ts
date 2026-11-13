// Decide, sem tocar no banco, o que muda em uma empresa existente.
// Regra: só corrige formato (espaços, CEP) e preenche campos vazios. Nunca altera conteúdo digitado.
import { normalizarCep, type EnderecoCompletado } from "../endereco/regras";

export type EmpresaParaNormalizar = {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  atividadePrincipal: string;
  endereco: { cep: string; logradouro: string; bairro: string } | null;
};

export type MudancasEmpresa = {
  razaoSocial?: string;
  nomeFantasia?: string | null;
  atividadePrincipal?: string;
  endereco?: { cep: string; logradouro: string; bairro: string };
};

// Remove espaços repetidos e das bordas. Maiúsculas e acentos ficam como o usuário digitou.
export function espacosNormalizados(valor: string): string {
  return valor.replace(/\s+/g, " ").trim();
}

/** Retorna só os campos que mudam, ou null se a empresa já está normalizada. */
export function planejarNormalizacao(
  empresa: EmpresaParaNormalizar,
  endereco: EnderecoCompletado | null,
): MudancasEmpresa | null {
  const mudancas: MudancasEmpresa = {};

  const razaoSocial = espacosNormalizados(empresa.razaoSocial);
  if (razaoSocial && razaoSocial !== empresa.razaoSocial) mudancas.razaoSocial = razaoSocial;

  if (empresa.nomeFantasia !== null) {
    const nomeFantasia = espacosNormalizados(empresa.nomeFantasia);
    if (nomeFantasia !== empresa.nomeFantasia) mudancas.nomeFantasia = nomeFantasia || null;
  }

  const atividadePrincipal = espacosNormalizados(empresa.atividadePrincipal);
  if (atividadePrincipal && atividadePrincipal !== empresa.atividadePrincipal) {
    mudancas.atividadePrincipal = atividadePrincipal;
  }

  if (empresa.endereco && endereco) {
    const enderecoNormalizado = {
      cep: normalizarCep(endereco.cep) || empresa.endereco.cep,
      logradouro: espacosNormalizados(endereco.logradouro),
      bairro: espacosNormalizados(endereco.bairro),
    };
    const alterou =
      enderecoNormalizado.cep !== empresa.endereco.cep ||
      enderecoNormalizado.logradouro !== empresa.endereco.logradouro ||
      enderecoNormalizado.bairro !== empresa.endereco.bairro;
    if (alterou) mudancas.endereco = enderecoNormalizado;
  }

  return Object.keys(mudancas).length > 0 ? mudancas : null;
}
