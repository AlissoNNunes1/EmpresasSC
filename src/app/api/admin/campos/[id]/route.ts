import { registerAccessLog } from "@/lib/access-log";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/session";
import { campoReorderSchema, campoUpdateSchema } from "@/lib/validations/campo";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const id = Number((await context.params).id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await request.json();

  // Reorder (array de IDs)
  if (body.ids) {
    const parsed = campoReorderSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    await prisma.$transaction(
      parsed.data.ids.map((campoId, index) =>
        prisma.campoEmpresa.update({ where: { id: campoId }, data: { ordem: index + 1 } })
      )
    );
    return NextResponse.json({ ok: true });
  }

  const parsed = campoUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });

  const campo = await prisma.campoEmpresa.findUnique({ where: { id } });
  if (!campo) return NextResponse.json({ error: "Campo não encontrado" }, { status: 404 });

  // Campos essenciais (cnpj, razaoSocial) nunca podem ser ocultados
  const IMUTAVEIS = ["cnpj", "razaoSocial"];
  if (IMUTAVEIS.includes(campo.nome) && parsed.data.visivel === false) {
    return NextResponse.json({ error: "Este campo não pode ser ocultado." }, { status: 422 });
  }

  const updated = await prisma.campoEmpresa.update({
    where: { id },
    data: {
      label: parsed.data.label,
      obrigatorio: parsed.data.obrigatorio,
      visivel: parsed.data.visivel,
      // tipo só pode ser alterado em campos custom
      tipo: !campo.builtin ? parsed.data.tipo : undefined,
      opcoes: parsed.data.opcoes !== undefined
        ? parsed.data.opcoes === null ? null : JSON.stringify(parsed.data.opcoes)
        : undefined,
    },
  });

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: `/api/admin/campos/${id}`,
    acao: `ATUALIZAR_CAMPO:${campo.nome}`,
    request,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: NextRequest, context: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const id = Number((await context.params).id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const campo = await prisma.campoEmpresa.findUnique({ where: { id } });
  if (!campo) return NextResponse.json({ error: "Campo não encontrado" }, { status: 404 });
  if (campo.builtin) return NextResponse.json({ error: "Campos padrão não podem ser excluídos." }, { status: 422 });

  await prisma.campoEmpresa.delete({ where: { id } });

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: `/api/admin/campos/${id}`,
    acao: `EXCLUIR_CAMPO:${campo.nome}`,
    request,
  });

  return new NextResponse(null, { status: 204 });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
