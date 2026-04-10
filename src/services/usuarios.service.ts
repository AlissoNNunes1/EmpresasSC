import { apiRequest } from "@/services/api";
import type { UsuarioSistema } from "@/types/usuario";

export async function listarUsuarios(): Promise<UsuarioSistema[]> {
  const data = await apiRequest<{ data: UsuarioSistema[] }>("/api/usuarios");
  return data.data;
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
