import { registerAccessLog } from "@/lib/access-log";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/session";
import { categoriaCreateSchema } from "@/lib/validations/configuracao";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);
  if (auth.denied) {
    return auth.denied;
  }

  const categorias = await prisma.categoria.findMany({
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      ativo: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  });

  return NextResponse.json({
    data: categorias.map((item) => ({
      id: item.id,
      nome: item.nome,
      status: item.ativo ? "ATIVO" : "INATIVO",
      criadoEm: item.criadoEm.toISOString(),
      atualizadoEm: item.atualizadoEm.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) {
    return auth.denied;
  }

  const body = await request.json();
  const parsed = categoriaCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const nome = parsed.data.nome.trim();
  const existente = await prisma.categoria.findUnique({ where: { nome } });
  if (existente) {
    return NextResponse.json({ error: "Categoria ja cadastrada" }, { status: 409 });
  }

  const created = await prisma.categoria.create({
    data: {
      nome,
      ativo: parsed.data.status === "ATIVO",
    },
  });

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: "/api/categorias",
    acao: `CRIAR_CATEGORIA:${created.id}`,
    request,
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

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
