import type { PapelUsuario } from "@prisma/client";

const ROLE_RANK: Record<PapelUsuario, number> = {
  ADMIN: 3,
  ANALISTA: 2,
  VISUALIZADOR: 1,
};

export function hasRequiredRole(userRole: PapelUsuario | undefined, requiredRole: PapelUsuario): boolean {
  if (!userRole) {
    return false;
  }

  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
