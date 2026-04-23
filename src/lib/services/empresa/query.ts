import { prisma } from "@/lib/prisma";
import { buildEmpresaWhere } from "@/lib/services/empresa/filters";
import type { FiltrosEmpresaInput } from "@/lib/validations/empresa";

export async function findEmpresas(filters: FiltrosEmpresaInput) {
  return prisma.empresa.findMany({
    where: buildEmpresaWhere(filters),
    include: {
      categoria: true,
      endereco: true,
      responsaveis: true,
      camposCustom: { include: { campo: true } },
    },
    orderBy: {
      razaoSocial: "asc",
    },
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
