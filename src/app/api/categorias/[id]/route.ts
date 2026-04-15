import { registerAccessLog } from "@/lib/access-log";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/session";
import { categoriaUpdateSchema } from "@/lib/validations/configuracao";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) {
    return auth.denied;
  }

  const id = Number((await context.params).id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = categoriaUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.nome) {
    const nome = parsed.data.nome.trim();
    const existente = await prisma.categoria.findUnique({ where: { nome } });
    if (existente && existente.id !== id) {
      return NextResponse.json({ error: "Nome de categoria ja em uso" }, { status: 409 });
    }
  }

  const updated = await prisma.categoria.update({
    where: { id },
    data: {
      nome: parsed.data.nome?.trim(),
      ativo: parsed.data.status ? parsed.data.status === "ATIVO" : undefined,
    },
  });

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: `/api/categorias/${id}`,
    acao: `ATUALIZAR_CATEGORIA:${id}`,
    request,
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      nome: updated.nome,
      status: updated.ativo ? "ATIVO" : "INATIVO",
      criadoEm: updated.criadoEm.toISOString(),
      atualizadoEm: updated.atualizadoEm.toISOString(),
    },
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
