import { registerAccessLog } from "@/lib/access-log";
import { prisma } from "@/lib/prisma";
import { refreshDashboardCacheViews } from "@/lib/services/dashboard/refresh";
import { requireApiAuth } from "@/lib/session";
import { onlyDigits } from "@/lib/utils";
import { empresaSchema } from "@/lib/validations/empresa";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);
  if (auth.denied) {
    return auth.denied;
  }

  const id = Number((await context.params).id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: {
      categoria: true,
      endereco: true,
      responsaveis: true,
      camposCustom: { include: { campo: true } },
    },
  });

  if (!empresa) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: `/api/empresas/${id}`,
    acao: "DETALHAR_EMPRESA",
    request,
  });

  return NextResponse.json(empresa);
}

export async function PUT(request: NextRequest, context: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);
  if (auth.denied) {
    return auth.denied;
  }

  const id = Number((await context.params).id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = empresaSchema.safeParse({
    ...body,
    cnpj: onlyDigits(body.cnpj ?? ""),
    endereco: {
      ...body.endereco,
      cep: onlyDigits(body.endereco?.cep ?? ""),
    },
    responsaveis: Array.isArray(body.responsaveis)
      ? body.responsaveis.map((item: { cpf?: string; [key: string]: unknown }) => ({
          ...item,
          cpf: onlyDigits(item.cpf ?? ""),
        }))
      : [],
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const camposCustom = Array.isArray(body.camposCustom)
    ? (body.camposCustom as { campoId: number; valor: string }[])
    : [];

  const updated = await prisma.$transaction(async (tx) => {
    await tx.pessoa.deleteMany({ where: { empresaId: id } });
    await tx.valorCampoEmpresa.deleteMany({ where: { empresaId: id } });

    return tx.empresa.update({
      where: { id },
      data: {
        razaoSocial: parsed.data.razaoSocial,
        nomeFantasia: parsed.data.nomeFantasia,
        cnpj: parsed.data.cnpj,
        porte: parsed.data.porte,
        categoriaId: parsed.data.categoriaId,
        atividadePrincipal: parsed.data.atividadePrincipal,
        numeroEmpregados: parsed.data.numeroEmpregados,
        situacao: parsed.data.situacao,
        endereco: {
          upsert: {
            update: parsed.data.endereco,
            create: parsed.data.endereco,
          },
        },
        responsaveis: { create: parsed.data.responsaveis },
        camposCustom: {
          create: camposCustom
            .filter((c) => c.valor?.trim())
            .map((c) => ({ campoId: c.campoId, valor: c.valor.trim() })),
        },
      },
      include: {
        categoria: true,
        endereco: true,
        responsaveis: true,
        camposCustom: { include: { campo: true } },
      },
    });
  });

  await refreshDashboardCacheViews();

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: `/api/empresas/${id}`,
    acao: "ATUALIZAR_EMPRESA",
    request,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, context: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) {
    return auth.denied;
  }

  const id = Number((await context.params).id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  await prisma.empresa.delete({ where: { id } });
  await refreshDashboardCacheViews();

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: `/api/empresas/${id}`,
    acao: "REMOVER_EMPRESA",
    request,
  });

  return NextResponse.json({ success: true });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
