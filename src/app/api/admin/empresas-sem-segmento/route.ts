import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const empresas = await prisma.empresa.findMany({
    where: { segmentoId: null },
    select: { id: true, razaoSocial: true, cnpj: true, porte: true, situacao: true },
    orderBy: { razaoSocial: "asc" },
  });

  return NextResponse.json(empresas);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const body = await request.json() as { segmentoId: number; empresaIds?: number[] };

  if (!body.segmentoId || typeof body.segmentoId !== "number") {
    return NextResponse.json({ error: "segmentoId obrigatório" }, { status: 400 });
  }

  const segmento = await prisma.segmento.findUnique({ where: { id: body.segmentoId }, select: { id: true } });
  if (!segmento) return NextResponse.json({ error: "Segmento não encontrado" }, { status: 404 });

  const where = body.empresaIds?.length
    ? { id: { in: body.empresaIds }, segmentoId: null }
    : { segmentoId: null };

  const result = await prisma.empresa.updateMany({
    where,
    data: { segmentoId: body.segmentoId },
  });

  return NextResponse.json({ atualizadas: result.count });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
