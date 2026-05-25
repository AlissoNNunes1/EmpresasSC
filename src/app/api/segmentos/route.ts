import { registerAccessLog } from "@/lib/access-log";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const segmentoSchema = z.object({
  nome: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  descricao: z.string().optional(),
  cor: z.string().optional(),
  icone: z.string().optional(),
  ordem: z.number().int().nonnegative().optional(),
  ativo: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);
  if (auth.denied) return auth.denied;

  const segmentos = await prisma.segmento.findMany({
    where: { ativo: true },
    orderBy: { ordem: "asc" },
  });

  return NextResponse.json(segmentos);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const body = await request.json();
  const parsed = segmentoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.segmento.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
  }

  const segmento = await prisma.segmento.create({ data: parsed.data });

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: "/api/segmentos",
    acao: "CRIAR_SEGMENTO",
    request,
  });

  return NextResponse.json(segmento, { status: 201 });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
