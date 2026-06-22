import type { FiltrosEmpresaInput } from "@/lib/validations/empresa";
import type { Prisma } from "@prisma/client";

export type CampoCustomFiltro = { campoId: number; valor: string };

export function buildEmpresaWhere(
  filters: FiltrosEmpresaInput,
  camposCustomFiltro?: CampoCustomFiltro[],
): Prisma.EmpresaWhereInput {
  const where: Prisma.EmpresaWhereInput = {};

  if (filters.categoriaId) {
    where.categoriaId = filters.categoriaId;
  }

  if (filters.bairro) {
    where.endereco = {
      bairro: {
        contains: filters.bairro,
      },
    };
  }

  if (filters.porte) {
    where.porte = filters.porte as Prisma.EmpresaWhereInput["porte"];
  }

  if (filters.situacao) {
    where.situacao = filters.situacao as Prisma.EmpresaWhereInput["situacao"];
  }

  if (typeof filters.minEmpregados === "number" || typeof filters.maxEmpregados === "number") {
    where.numeroEmpregados = {
      gte: filters.minEmpregados,
      lte: filters.maxEmpregados,
    };
  }

  if (filters.termo) {
    where.OR = [
      {
        razaoSocial: {
          contains: filters.termo,
        },
      },
      {
        nomeFantasia: {
          contains: filters.termo,
        },
      },
      {
        cnpj: {
          contains: filters.termo,
        },
      },
    ];
  }

  if (camposCustomFiltro && camposCustomFiltro.length > 0) {
    where.AND = camposCustomFiltro.map((filtro) => ({
      camposCustom: {
        some: {
          campoId: filtro.campoId,
          valor: { contains: filtro.valor },
        },
      },
    }));
  }

  return where;
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
