import { NextRequest, NextResponse } from "next/server";
import { PapelUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/session";
import { registerAccessLog } from "@/lib/access-log";
import { usuarioStatusSchema } from "@/lib/validations/usuario";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) {
    return auth.denied;
  }

  const id = Number((await context.params).id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = usuarioStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Status invalido" }, { status: 400 });
  }

  const usuarioLogadoId = Number(auth.session?.user.id);
  if (usuarioLogadoId === id && parsed.data.status === "INATIVO") {
    return NextResponse.json({ error: "Nao e permitido desativar o proprio usuario" }, { status: 400 });
  }

  const updated = await prisma.usuario.update({
    where: { id },
    data: { ativo: parsed.data.status === "ATIVO" },
  });

  await registerAccessLog({
    usuarioId: usuarioLogadoId,
    email: auth.session?.user.email ?? undefined,
    rota: `/api/usuarios/${id}/status`,
    acao: `ATUALIZAR_STATUS_USUARIO:${id}:${parsed.data.status}`,
    request,
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      status: updated.ativo ? "ATIVO" : "INATIVO",
    },
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
