import { prisma } from "@/lib/prisma";
import { buildEmpresaWhere, type CampoCustomFiltro } from "@/lib/services/empresa/filters";
import { buildEmpresaOrderBy } from "@/lib/services/empresa/sort";
import type { FiltrosEmpresaInput } from "@/lib/validations/empresa";

export async function findEmpresas(
  filters: FiltrosEmpresaInput,
  segmentoSlug?: string,
  camposCustomFiltro?: CampoCustomFiltro[],
) {
  const where = buildEmpresaWhere(filters, camposCustomFiltro);
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
    orderBy: buildEmpresaOrderBy(filters.sortBy, filters.sortDir),
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
