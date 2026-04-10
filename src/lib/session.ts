import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PapelUsuario } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { hasRequiredRole } from "@/lib/permissions";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireApiAuth(request: NextRequest, requiredRole: PapelUsuario = PapelUsuario.VISUALIZADOR) {
  const session = await getCurrentSession();

  if (!session?.user?.id || !hasRequiredRole(session.user.role, requiredRole)) {
    return {
      session,
      denied: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
    };
  }

  return { session, denied: null };
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
