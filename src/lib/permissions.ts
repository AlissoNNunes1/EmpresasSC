import type { PapelUsuario } from "@prisma/client";

const ROLE_RANK: Record<PapelUsuario, number> = {
  ADMIN: 3,
  ANALISTA: 2,
  VISUALIZADOR: 1,
};

const ROLE_ALIASES: Record<string, PapelUsuario> = {
  ADMIN: "ADMIN",
  ANALISTA: "ANALISTA",
  VISUALIZADOR: "VISUALIZADOR",
  OPERADOR: "ANALISTA",
};

export function normalizeUserRole(userRole: PapelUsuario | string | undefined): PapelUsuario {
  if (!userRole) {
    return "VISUALIZADOR";
  }

  const normalized = String(userRole).trim().toUpperCase();
  return ROLE_ALIASES[normalized] ?? "VISUALIZADOR";
}

export function hasRequiredRole(userRole: PapelUsuario | string | undefined, requiredRole: PapelUsuario): boolean {
  const normalizedRole = normalizeUserRole(userRole);
  return ROLE_RANK[normalizedRole] >= ROLE_RANK[requiredRole];
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
