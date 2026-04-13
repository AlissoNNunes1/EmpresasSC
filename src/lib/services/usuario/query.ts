import { PapelUsuario, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { UsuarioFiltros, UsuarioSistema } from "@/types/usuario";

function buildWhere(filtros: UsuarioFiltros): Prisma.UsuarioWhereInput {
  const where: Prisma.UsuarioWhereInput = {};

  if (filtros.role) {
    where.papel = filtros.role;
  }

  if (filtros.status) {
    where.ativo = filtros.status === "ATIVO";
  }

  if (filtros.termo) {
    where.OR = [
      { nome: { contains: filtros.termo } },
      { email: { contains: filtros.termo } },
    ];
  }

  return where;
}

export async function listUsuarios(filtros: UsuarioFiltros = {}): Promise<UsuarioSistema[]> {
  const usuarios = await prisma.usuario.findMany({
    where: buildWhere(filtros),
    orderBy: { nome: "asc" },
  });

  const logs = await prisma.logAcesso.groupBy({
    by: ["usuarioId"],
    _max: { criadoEm: true },
    where: {
      usuarioId: { not: null },
    },
  });

  const ultimoAcessoMap = new Map<number, Date>();
  logs.forEach((item) => {
    if (item.usuarioId && item._max.criadoEm) {
      ultimoAcessoMap.set(item.usuarioId, item._max.criadoEm);
    }
  });

  return usuarios.map((usuario) => ({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.papel as PapelUsuario,
    status: usuario.ativo ? "ATIVO" : "INATIVO",
    ultimoAcesso: ultimoAcessoMap.get(usuario.id)?.toISOString() ?? null,
    criadoEm: usuario.criadoEm.toISOString(),
  }));
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
