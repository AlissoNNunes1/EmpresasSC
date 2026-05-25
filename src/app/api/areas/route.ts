import { registerAccessLog } from "@/lib/access-log";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const areaSchema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional(),
  tipo: z.string().min(1),
  cor: z.string().optional(),
  geoJson: z.string().min(1),
  segmentoId: z.number().int().positive().optional(),
  ativo: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);
  if (auth.denied) return auth.denied;

  const sp = request.nextUrl.searchParams;
  const segmentoId = sp.get("segmentoId") ? Number(sp.get("segmentoId")) : undefined;
  const tipo = sp.get("tipo") ?? undefined;
  const ativo = sp.has("ativo") ? sp.get("ativo") !== "false" : true;

  const areas = await prisma.area.findMany({
    where: {
      ativo,
      ...(segmentoId ? { segmentoId } : {}),
      ...(tipo ? { tipo } : {}),
    },
    include: { segmento: { select: { id: true, nome: true, slug: true, cor: true } } },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(areas);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);
  if (auth.denied) return auth.denied;

  const body = await request.json();
  const parsed = areaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const area = await prisma.area.create({ data: parsed.data });

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: "/api/areas",
    acao: "CRIAR_AREA",
    request,
  });

  return NextResponse.json(area, { status: 201 });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
