import { prisma } from "@/lib/prisma";
import { buildEmpresaWhere } from "@/lib/services/empresa/filters";
import type { FiltrosEmpresaInput } from "@/lib/validations/empresa";

export async function findEmpresas(filters: FiltrosEmpresaInput, segmentoSlug?: string) {
  const where = buildEmpresaWhere(filters);
  if (segmentoSlug) {
    where.segmento = { slug: segmentoSlug };
  }
  return prisma.empresa.findMany({
    where,
    include: {
      categoria: true,
      segmento: { select: { id: true, nome: true, slug: true, cor: true } },
      endereco: true,
      responsaveis: true,
      camposCustom: { include: { campo: true } },
    },
    orderBy: { razaoSocial: "asc" },
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
