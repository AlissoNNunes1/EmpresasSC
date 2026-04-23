import { registerAccessLog } from "@/lib/access-log";
import { prisma } from "@/lib/prisma";
import { getOrInitCampos } from "@/lib/services/campo/query";
import { requireApiAuth } from "@/lib/session";
import { campoCreateSchema } from "@/lib/validations/campo";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const campos = await getOrInitCampos();
  return NextResponse.json({ data: campos });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const body = await request.json();
  const parsed = campoCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const existente = await prisma.campoEmpresa.findUnique({ where: { nome: parsed.data.nome } });
  if (existente) {
    return NextResponse.json({ error: "Já existe um campo com este nome." }, { status: 409 });
  }

  const maxOrdem = await prisma.campoEmpresa.aggregate({ _max: { ordem: true } });
  const novaOrdem = (maxOrdem._max.ordem ?? 0) + 1;

  const campo = await prisma.campoEmpresa.create({
    data: {
      nome: parsed.data.nome,
      label: parsed.data.label,
      tipo: parsed.data.tipo,
      obrigatorio: parsed.data.obrigatorio,
      builtin: false,
      visivel: true,
      ordem: novaOrdem,
      opcoes: parsed.data.opcoes ? JSON.stringify(parsed.data.opcoes) : null,
    },
  });

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: "/api/admin/campos",
    acao: `CRIAR_CAMPO:${campo.nome}`,
    request,
  });

  return NextResponse.json({ data: campo }, { status: 201 });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
