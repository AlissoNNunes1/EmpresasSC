import { registerAccessLog } from "@/lib/access-log";
import { prisma } from "@/lib/prisma";
import { listUsuarios } from "@/lib/services/usuario/query";
import { requireApiAuth } from "@/lib/session";
import { filtrosUsuarioSchema, usuarioCreateSchema } from "@/lib/validations/usuario";
import { PapelUsuario } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) {
    return auth.denied;
  }

  const parsed = filtrosUsuarioSchema.safeParse({
    termo: request.nextUrl.searchParams.get("termo") ?? undefined,
    role: request.nextUrl.searchParams.get("role") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Filtros invalidos" }, { status: 400 });
  }

  const usuarios = await listUsuarios(parsed.data);

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: "/api/usuarios",
    acao: "LISTAR_USUARIOS",
    request,
  });

  return NextResponse.json({ data: usuarios });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) {
    return auth.denied;
  }

  const body = await request.json();
  const parsed = usuarioCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json({ error: "Ja existe usuario com este email" }, { status: 409 });
  }

  const senhaHash = await hash(parsed.data.senha, 10);

  const created = await prisma.usuario.create({
    data: {
      nome: parsed.data.nome,
      email,
      senhaHash,
      papel: parsed.data.role,
      ativo: parsed.data.status === "ATIVO",
    },
  });

  // Atribui segmentos se fornecidos (vazio = acesso global)
  const segmentoIds: number[] | undefined = Array.isArray(parsed.data.segmentoIds)
    ? parsed.data.segmentoIds.filter((n) => Number.isFinite(n))
    : undefined;

  if (segmentoIds && segmentoIds.length > 0) {
    for (const segmentoId of segmentoIds) {
      await prisma.usuarioSegmento.create({ data: { usuarioId: created.id, segmentoId } });
    }
  }

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: "/api/usuarios",
    acao: `CRIAR_USUARIO:${created.id}`,
    request,
  });

  return NextResponse.json({
    data: {
      id: created.id,
      nome: created.nome,
      email: created.email,
      role: created.papel,
      status: created.ativo ? "ATIVO" : "INATIVO",
      ultimoAcesso: null,
      criadoEm: created.criadoEm.toISOString(),
    },
  }, { status: 201 });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
