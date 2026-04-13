import { apiRequest } from "@/services/api";
import type { UsuarioFiltros, UsuarioPayload, UsuarioSistema } from "@/types/usuario";

function toQuery(filtros: UsuarioFiltros = {}): string {
  const params = new URLSearchParams();

  if (filtros.termo) {
    params.set("termo", filtros.termo);
  }

  if (filtros.role) {
    params.set("role", filtros.role);
  }

  if (filtros.status) {
    params.set("status", filtros.status);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listarUsuarios(filtros: UsuarioFiltros = {}): Promise<UsuarioSistema[]> {
  const data = await apiRequest<{ data: UsuarioSistema[] }>(`/api/usuarios${toQuery(filtros)}`);
  return data.data;
}

export async function criarUsuario(payload: UsuarioPayload): Promise<UsuarioSistema> {
  const data = await apiRequest<{ data: UsuarioSistema }>("/api/usuarios", {
    method: "POST",
    body: payload,
  });

  return data.data;
}

export async function atualizarUsuario(id: number, payload: Partial<UsuarioPayload>): Promise<UsuarioSistema> {
  const data = await apiRequest<{ data: UsuarioSistema }>(`/api/usuarios/${id}`, {
    method: "PUT",
    body: payload,
  });

  return data.data;
}

export async function atualizarStatusUsuario(id: number, status: "ATIVO" | "INATIVO") {
  return apiRequest<{ data: { id: number; status: "ATIVO" | "INATIVO" } }>(`/api/usuarios/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
