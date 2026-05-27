import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ slug: string }> };

const createSchema = z.object({
  nome: z.string().min(1).max(100).transform((s) => s.trim()),
  status: z.enum(["ATIVO", "INATIVO"]).default("ATIVO"),
});

const updateSchema = z.object({
  nome: z.string().min(1).max(100).transform((s) => s.trim()).optional(),
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
});

async function resolveSegmento(slug: string) {
  return prisma.segmento.findUnique({ where: { slug } });
}

/** GET /api/segmentos/[slug]/categorias — lista categorias do segmento */
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);
  if (auth.denied) return auth.denied;

  const { slug } = await params;
  const segmento = await resolveSegmento(slug);
  if (!segmento) return NextResponse.json({ error: "Segmento não encontrado" }, { status: 404 });

  const categorias = await prisma.categoria.findMany({
    where: { segmentoId: segmento.id },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, ativo: true, criadoEm: true, atualizadoEm: true },
  });

  return NextResponse.json({
    data: categorias.map((c) => ({
      id: c.id,
      nome: c.nome,
      status: c.ativo ? "ATIVO" : "INATIVO",
      criadoEm: c.criadoEm.toISOString(),
      atualizadoEm: c.atualizadoEm.toISOString(),
    })),
  });
}

/** POST /api/segmentos/[slug]/categorias — criar categoria do segmento */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const { slug } = await params;
  const segmento = await resolveSegmento(slug);
  if (!segmento) return NextResponse.json({ error: "Segmento não encontrado" }, { status: 404 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  // Verifica unicidade dentro do segmento (SQLite não garante null compound uniqueness)
  const existente = await prisma.categoria.findFirst({
    where: { nome: parsed.data.nome, segmentoId: segmento.id },
  });
  if (existente) {
    return NextResponse.json({ error: "Categoria já cadastrada neste segmento." }, { status: 409 });
  }

  const created = await prisma.categoria.create({
    data: {
      nome: parsed.data.nome,
      ativo: parsed.data.status === "ATIVO",
      segmentoId: segmento.id,
    },
  });

  return NextResponse.json({
    data: {
      id: created.id,
      nome: created.nome,
      status: created.ativo ? "ATIVO" : "INATIVO",
      criadoEm: created.criadoEm.toISOString(),
      atualizadoEm: created.atualizadoEm.toISOString(),
    },
  }, { status: 201 });
}

/** PUT /api/segmentos/[slug]/categorias/[id] via this handler is not needed —
 *  use /api/categorias/[id] directly since it works by ID regardless of segment */

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
