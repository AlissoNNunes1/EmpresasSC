import { NextRequest, NextResponse } from "next/server";
import { PapelUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerAccessLog } from "@/lib/access-log";
import { requireApiAuth } from "@/lib/session";
import { refreshDashboardCacheViews } from "@/lib/services/dashboard/refresh";
import { findEmpresas } from "@/lib/services/empresa/query";
import { empresaSchema, filtrosEmpresaSchema } from "@/lib/validations/empresa";
import { onlyDigits } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);
  if (auth.denied) {
    return auth.denied;
  }

  const parsedFilters = filtrosEmpresaSchema.safeParse({
    categoriaId: request.nextUrl.searchParams.get("categoriaId") ?? undefined,
    bairro: request.nextUrl.searchParams.get("bairro") ?? undefined,
    porte: request.nextUrl.searchParams.get("porte") ?? undefined,
    situacao: request.nextUrl.searchParams.get("situacao") ?? undefined,
    minEmpregados: request.nextUrl.searchParams.get("minEmpregados") ?? undefined,
    maxEmpregados: request.nextUrl.searchParams.get("maxEmpregados") ?? undefined,
    termo: request.nextUrl.searchParams.get("termo") ?? undefined,
  });

  if (!parsedFilters.success) {
    return NextResponse.json({ error: "Filtros invalidos", details: parsedFilters.error.flatten() }, { status: 400 });
  }

  const empresas = await findEmpresas(parsedFilters.data);

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: "/api/empresas",
    acao: "LISTAR_EMPRESAS",
    request,
  });

  return NextResponse.json(empresas);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);
  if (auth.denied) {
    return auth.denied;
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

  const created = await prisma.empresa.create({
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
        create: parsed.data.endereco,
      },
      responsaveis: {
        create: parsed.data.responsaveis,
      },
    },
    include: {
      categoria: true,
      endereco: true,
      responsaveis: true,
    },
  });

  await refreshDashboardCacheViews();

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: "/api/empresas",
    acao: "CRIAR_EMPRESA",
    request,
  });

  return NextResponse.json(created, { status: 201 });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
