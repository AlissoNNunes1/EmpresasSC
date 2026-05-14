import { registerAccessLog } from "@/lib/access-log";
import { runRelatorioQuery } from "@/lib/services/relatorio/query";
import { requireApiAuth } from "@/lib/session";
import { relatorioQuerySchema } from "@/lib/validations/relatorio";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);
  if (auth.denied) return auth.denied;

  const sp = request.nextUrl.searchParams;
  const parsed = relatorioQuerySchema.safeParse({
    groupBy: sp.get("groupBy") ?? undefined,
    metrica: sp.get("metrica") ?? undefined,
    situacao: sp.get("situacao") ?? undefined,
    porte: sp.get("porte") ?? undefined,
    categoriaId: sp.get("categoriaId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const rows = await runRelatorioQuery(parsed.data);
  const total = rows.reduce((acc, r) => acc + r.value, 0);

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: "/api/relatorios/query",
    acao: "CONSULTAR_RELATORIO",
    request,
  });

  return NextResponse.json({
    rows,
    total,
    groupBy: parsed.data.groupBy,
    metrica: parsed.data.metrica,
  });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
