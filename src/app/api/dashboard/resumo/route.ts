import { NextRequest, NextResponse } from "next/server";
import { PapelUsuario } from "@prisma/client";
import { getDashboardResumo } from "@/lib/services/dashboard/query";
import { requireApiAuth } from "@/lib/session";
import { registerAccessLog } from "@/lib/access-log";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);

  if (auth.denied) {
    return auth.denied;
  }

  const data = await getDashboardResumo();

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: "/api/dashboard/resumo",
    acao: "CONSULTAR_RESUMO",
    request,
  });

  return NextResponse.json(data);
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
