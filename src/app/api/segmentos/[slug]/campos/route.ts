import { prisma } from "@/lib/prisma";
import { getCamposDoSegmento } from "@/lib/services/campo/query";
import { requireApiAuth } from "@/lib/session";
import { TIPOS_CAMPO } from "@/lib/validations/campo";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ slug: string }> };

const campoSegmentoCreateSchema = z.object({
  label: z.string().min(1).max(80),
  tipo: z.enum(TIPOS_CAMPO),
  obrigatorio: z.boolean().default(false),
  opcoes: z.array(z.string().min(1)).optional(),
});

function slugifyNome(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32);
}

async function resolveSegmento(slug: string) {
  return prisma.segmento.findUnique({ where: { slug } });
}

/** GET /api/segmentos/[slug]/campos — campos específicos do segmento */
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);
  if (auth.denied) return auth.denied;

  const { slug } = await params;
  const segmento = await resolveSegmento(slug);
  if (!segmento) return NextResponse.json({ error: "Segmento não encontrado" }, { status: 404 });

  const campos = await getCamposDoSegmento(segmento.id);
  return NextResponse.json({ data: campos });
}

/** POST /api/segmentos/[slug]/campos — criar campo exclusivo do segmento */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const { slug } = await params;
  const segmento = await resolveSegmento(slug);
  if (!segmento) return NextResponse.json({ error: "Segmento não encontrado" }, { status: 404 });

  const body = await request.json();
  const parsed = campoSegmentoCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  // Gera nome interno único prefixado com o segmento para não colidir com campos globais
  const base = `seg${segmento.id}_${slugifyNome(parsed.data.label)}`;
  let nome = base;
  let tentativa = 0;
  while (await prisma.campoEmpresa.findUnique({ where: { nome } })) {
    tentativa++;
    nome = `${base}_${tentativa}`;
  }

  const maxOrdem = await prisma.campoEmpresa.aggregate({
    _max: { ordem: true },
    where: { segmentoId: segmento.id },
  });
  const novaOrdem = (maxOrdem._max.ordem ?? 0) + 1;

  const campo = await prisma.campoEmpresa.create({
    data: {
      nome,
      label: parsed.data.label,
      tipo: parsed.data.tipo,
      obrigatorio: parsed.data.obrigatorio,
      builtin: false,
      visivel: true,
      ordem: novaOrdem,
      segmentoId: segmento.id,
      opcoes: parsed.data.opcoes ? JSON.stringify(parsed.data.opcoes) : null,
    },
  });

  return NextResponse.json({ data: campo }, { status: 201 });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
