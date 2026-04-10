import { NextRequest, NextResponse } from "next/server";
import { PapelUsuario } from "@prisma/client";
import { refreshDashboardCacheViews } from "@/lib/services/dashboard/refresh";
import { requireApiAuth } from "@/lib/session";
import { registerAccessLog } from "@/lib/access-log";

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);

  if (auth.denied) {
    return auth.denied;
  }

  await refreshDashboardCacheViews();

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: "/api/dashboard/refresh",
    acao: "ATUALIZAR_CACHE_DASHBOARD",
    request,
  });

  return NextResponse.json({ success: true });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
