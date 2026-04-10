import { apiRequest } from "@/services/api";
import type { EmpresaRecord } from "@/types/empresa";

export async function listarEmpresas(query = ""): Promise<EmpresaRecord[]> {
  const suffix = query ? `?${query}` : "";
  const data = await apiRequest<{ data: EmpresaRecord[] }>(`/api/empresas${suffix}`);
  return data.data;
}

export async function excluirEmpresa(id: number): Promise<void> {
  await apiRequest(`/api/empresas/${id}`, { method: "DELETE" });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
