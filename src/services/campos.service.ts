import { apiRequest } from "@/services/api";

export type CampoEmpresaConfig = {
  id: number;
  nome: string;
  label: string;
  tipo: "TEXTO" | "NUMERO" | "SELECT" | "TEXTAREA" | "DATA";
  builtin: boolean;
  obrigatorio: boolean;
  visivel: boolean;
  ordem: number;
  opcoes: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type CampoCreatePayload = {
  nome: string;
  label: string;
  tipo: CampoEmpresaConfig["tipo"];
  obrigatorio: boolean;
  opcoes?: string[];
};

export type CampoUpdatePayload = {
  label?: string;
  tipo?: CampoEmpresaConfig["tipo"];
  obrigatorio?: boolean;
  visivel?: boolean;
  opcoes?: string[] | null;
};

export function parseCampoOpcoes(opcoes: string | null): string[] {
  if (!opcoes) return [];
  try {
    const parsed = JSON.parse(opcoes);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function listarCampos(): Promise<CampoEmpresaConfig[]> {
  const res = await apiRequest<{ data: CampoEmpresaConfig[] }>("/api/admin/campos");
  return res.data;
}

export async function criarCampo(payload: CampoCreatePayload): Promise<CampoEmpresaConfig> {
  const res = await apiRequest<{ data: CampoEmpresaConfig }>("/api/admin/campos", {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function atualizarCampo(id: number, payload: CampoUpdatePayload): Promise<CampoEmpresaConfig> {
  const res = await apiRequest<{ data: CampoEmpresaConfig }>(`/api/admin/campos/${id}`, {
    method: "PUT",
    body: payload,
  });
  return res.data;
}

export async function reordenarCampos(ids: number[]): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/api/admin/campos/0`, {
    method: "PUT",
    body: { ids },
  });
}

export async function excluirCampo(id: number): Promise<void> {
  await apiRequest<void>(`/api/admin/campos/${id}`, { method: "DELETE" });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
