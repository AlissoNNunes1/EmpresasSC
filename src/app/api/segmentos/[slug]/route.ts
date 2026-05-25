import { registerAccessLog } from "@/lib/access-log";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ slug: string }> };

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional(),
  cor: z.string().optional(),
  icone: z.string().optional(),
  ordem: z.number().int().nonnegative().optional(),
  ativo: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);
  if (auth.denied) return auth.denied;

  const { slug } = await params;
  const segmento = await prisma.segmento.findUnique({
    where: { slug },
    include: { _count: { select: { empresas: true, areas: true } } },
  });

  if (!segmento) return NextResponse.json({ error: "Segmento não encontrado" }, { status: 404 });
  return NextResponse.json(segmento);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const { slug } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const segmento = await prisma.segmento.update({ where: { slug }, data: parsed.data });

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: `/api/segmentos/${slug}`,
    acao: "ATUALIZAR_SEGMENTO",
    request,
  });

  return NextResponse.json(segmento);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const { slug } = await params;
  const count = await prisma.empresa.count({ where: { segmento: { slug } } });
  if (count > 0) {
    return NextResponse.json({ error: `Segmento possui ${count} empresa(s). Mova-as antes de excluir.` }, { status: 409 });
  }

  await prisma.segmento.delete({ where: { slug } });

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: `/api/segmentos/${slug}`,
    acao: "EXCLUIR_SEGMENTO",
    request,
  });

  return NextResponse.json({ success: true });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
