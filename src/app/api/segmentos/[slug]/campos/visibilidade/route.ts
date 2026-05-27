import { prisma } from "@/lib/prisma";
import { getOrInitCampos } from "@/lib/services/campo/query";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ slug: string }> };

const IMUTAVEIS = ["cnpj", "razaoSocial"];

const toggleSchema = z.object({
  campoId: z.number().int().positive(),
  ativo: z.boolean(),
});

async function resolveSegmento(slug: string) {
  return prisma.segmento.findUnique({ where: { slug } });
}

/**
 * GET /api/segmentos/[slug]/campos/visibilidade
 * Retorna todos os campos globais com o status de visibilidade para este segmento.
 * Se não existe override → usa visível global (ativo: true por padrão).
 */
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const { slug } = await params;
  const segmento = await resolveSegmento(slug);
  if (!segmento) return NextResponse.json({ error: "Segmento não encontrado" }, { status: 404 });

  await getOrInitCampos();

  const [globais, overrides] = await Promise.all([
    prisma.campoEmpresa.findMany({
      where: { segmentoId: null },
      orderBy: { ordem: "asc" },
      select: { id: true, nome: true, label: true, tipo: true, builtin: true, visivel: true, ordem: true },
    }),
    prisma.segmentoCampoConfig.findMany({ where: { segmentoId: segmento.id } }),
  ]);

  const overrideMap = new Map(overrides.map((o) => [o.campoId, o.ativo]));

  const data = globais.map((c) => ({
    ...c,
    // ativoNoSegmento = override se existe, senão usa visível global
    ativoNoSegmento: overrideMap.has(c.id) ? overrideMap.get(c.id)! : c.visivel,
    imutavel: IMUTAVEIS.includes(c.nome),
  }));

  return NextResponse.json({ data });
}

/**
 * PUT /api/segmentos/[slug]/campos/visibilidade
 * Atualiza (upsert) o override de visibilidade de um campo global para este segmento.
 * Body: { campoId: number, ativo: boolean }
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const { slug } = await params;
  const segmento = await resolveSegmento(slug);
  if (!segmento) return NextResponse.json({ error: "Segmento não encontrado" }, { status: 404 });

  const body = await request.json();
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const campo = await prisma.campoEmpresa.findUnique({
    where: { id: parsed.data.campoId },
    select: { nome: true, segmentoId: true },
  });

  if (!campo || campo.segmentoId !== null) {
    return NextResponse.json({ error: "Campo não encontrado ou não é global." }, { status: 404 });
  }
  if (IMUTAVEIS.includes(campo.nome)) {
    return NextResponse.json({ error: "Este campo não pode ser ocultado." }, { status: 422 });
  }

  await prisma.segmentoCampoConfig.upsert({
    where: { segmentoId_campoId: { segmentoId: segmento.id, campoId: parsed.data.campoId } },
    update: { ativo: parsed.data.ativo },
    create: { segmentoId: segmento.id, campoId: parsed.data.campoId, ativo: parsed.data.ativo },
  });

  return NextResponse.json({ ok: true });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
