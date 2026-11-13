import {
  iniciarNormalizacao,
  normalizacaoEmAndamento,
  ultimoResultadoNormalizacao,
} from "@/lib/services/normalizacao/empresas";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

/** POST /api/admin/normalizacao — dispara a normalização em background (202), ou 409 se já estiver rodando. */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const iniciou = iniciarNormalizacao();
  return NextResponse.json(
    { iniciou, emAndamento: true },
    { status: iniciou ? 202 : 409 },
  );
}

/** GET /api/admin/normalizacao — situação da última execução. */
export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  return NextResponse.json({
    emAndamento: normalizacaoEmAndamento(),
    ultimo: ultimoResultadoNormalizacao(),
  });
}
