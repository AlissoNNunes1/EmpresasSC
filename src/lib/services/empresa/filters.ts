import type { Prisma } from "@prisma/client";
import type { FiltrosEmpresaInput } from "@/lib/validations/empresa";

export function buildEmpresaWhere(filters: FiltrosEmpresaInput): Prisma.EmpresaWhereInput {
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

  return where;
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
