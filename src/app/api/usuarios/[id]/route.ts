import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { PapelUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/session";
import { registerAccessLog } from "@/lib/access-log";
import { usuarioUpdateSchema } from "@/lib/validations/usuario";

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
  const parsed = usuarioUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados invalidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const usuarioAtual = await prisma.usuario.findUnique({ where: { id } });
  if (!usuarioAtual) {
    return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  const usuarioLogadoId = Number(auth.session?.user.id);
  if (usuarioLogadoId === id && parsed.data.status === "INATIVO") {
    return NextResponse.json({ error: "Nao e permitido desativar o proprio usuario" }, { status: 400 });
  }

  if (parsed.data.email) {
    const email = parsed.data.email.trim().toLowerCase();
    const outro = await prisma.usuario.findUnique({ where: { email } });
    if (outro && outro.id !== id) {
      return NextResponse.json({ error: "Ja existe usuario com este email" }, { status: 409 });
    }
  }

  const updated = await prisma.usuario.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      email: parsed.data.email?.trim().toLowerCase(),
      papel: parsed.data.role,
      ativo: parsed.data.status ? parsed.data.status === "ATIVO" : undefined,
      senhaHash: parsed.data.senha ? await hash(parsed.data.senha, 10) : undefined,
    },
  });

  await registerAccessLog({
    usuarioId: usuarioLogadoId,
    email: auth.session?.user.email ?? undefined,
    rota: `/api/usuarios/${id}`,
    acao: parsed.data.senha ? `EDITAR_USUARIO_E_RESET_SENHA:${id}` : `EDITAR_USUARIO:${id}`,
    request,
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      nome: updated.nome,
      email: updated.email,
      role: updated.papel,
      status: updated.ativo ? "ATIVO" : "INATIVO",
      criadoEm: updated.criadoEm.toISOString(),
    },
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
