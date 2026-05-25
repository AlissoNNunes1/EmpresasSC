import { registerAccessLog } from "@/lib/access-log";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional(),
  tipo: z.string().min(1).optional(),
  cor: z.string().optional(),
  geoJson: z.string().optional(),
  segmentoId: z.number().int().positive().nullable().optional(),
  ativo: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);
  if (auth.denied) return auth.denied;

  const id = Number((await params).id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const area = await prisma.area.findUnique({
    where: { id },
    include: { segmento: { select: { id: true, nome: true, slug: true, cor: true } } },
  });

  if (!area) return NextResponse.json({ error: "Área não encontrada" }, { status: 404 });
  return NextResponse.json(area);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);
  if (auth.denied) return auth.denied;

  const id = Number((await params).id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const area = await prisma.area.update({ where: { id }, data: parsed.data });

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: `/api/areas/${id}`,
    acao: "ATUALIZAR_AREA",
    request,
  });

  return NextResponse.json(area);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const id = Number((await params).id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  await prisma.area.delete({ where: { id } });

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: `/api/areas/${id}`,
    acao: "EXCLUIR_AREA",
    request,
  });

  return NextResponse.json({ success: true });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
