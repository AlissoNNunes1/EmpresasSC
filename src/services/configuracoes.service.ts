import { apiRequest } from "@/services/api";

export type CategoriaConfig = {
  id: number;
  nome: string;
  status: "ATIVO" | "INATIVO";
  criadoEm: string;
  atualizadoEm: string;
};

export type ConfiguracaoPayload = {
  nomeSistema: string;
  nomeMunicipio: string;
  logoUrl?: string | null;
  emailInstitucional: string;
  minEmpregadosPequena: number;
  maxEmpregadosPequena: number;
  minEmpregadosMedia: number;
  maxEmpregadosMedia: number;
  categoriaPadraoId?: number | null;
  politicaSenhaMinCaracteres: number;
  tempoSessaoMinutos: number;
  controleLoginAtivo: boolean;
  integracaoCnpjAtiva: boolean;
  webhookUrl?: string | null;
};

export type ConfiguracaoSistema = ConfiguracaoPayload & {
  id: number;
  criadoEm: string;
  atualizadoEm: string;
};

export async function obterConfiguracao(): Promise<ConfiguracaoSistema> {
  const data = await apiRequest<{ data: ConfiguracaoSistema }>("/api/config");
  return data.data;
}

export async function salvarConfiguracao(payload: ConfiguracaoPayload): Promise<ConfiguracaoSistema> {
  const data = await apiRequest<{ data: ConfiguracaoSistema }>("/api/config", {
    method: "PUT",
    body: payload,
  });

  return data.data;
}

export async function listarCategoriasConfig(): Promise<CategoriaConfig[]> {
  const data = await apiRequest<{ data: CategoriaConfig[] }>("/api/categorias");
  return data.data;
}

export async function criarCategoriaConfig(payload: { nome: string; status: "ATIVO" | "INATIVO" }) {
  return apiRequest<{ data: CategoriaConfig }>("/api/categorias", {
    method: "POST",
    body: payload,
  });
}

export async function atualizarCategoriaConfig(
  id: number,
  payload: { nome?: string; status?: "ATIVO" | "INATIVO" }
) {
  return apiRequest<{ data: CategoriaConfig }>(`/api/categorias/${id}`, {
    method: "PUT",
    body: payload,
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
