import { listarGruposDeDuplicatas } from "@/lib/services/duplicatas/revisao";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/duplicatas — grupos de possíveis duplicatas ainda não revisados. */
export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);
  if (auth.denied) return auth.denied;

  const grupos = await listarGruposDeDuplicatas();
  return NextResponse.json({ grupos });
}
