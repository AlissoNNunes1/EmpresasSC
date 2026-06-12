import type { Prisma } from "@prisma/client";

export type EmpresaSortKey =
  | "razaoSocial"
  | "cnpj"
  | "categoria"
  | "bairro"
  | "porte"
  | "numeroEmpregados"
  | "situacao"
  | "id";

export type SortDirection = "asc" | "desc";

export const DEFAULT_EMPRESA_SORT: { sortBy: EmpresaSortKey; sortDir: SortDirection } = {
  sortBy: "razaoSocial",
  sortDir: "asc",
};

const SORT_KEYS: EmpresaSortKey[] = [
  "id",
  "razaoSocial",
  "cnpj",
  "categoria",
  "bairro",
  "porte",
  "numeroEmpregados",
  "situacao",
];

export function normalizeEmpresaSort(sortBy?: string | null, sortDir?: string | null) {
  const normalizedSortBy = SORT_KEYS.includes(sortBy as EmpresaSortKey)
    ? (sortBy as EmpresaSortKey)
    : DEFAULT_EMPRESA_SORT.sortBy;
  const normalizedSortDir: SortDirection = sortDir === "desc" ? "desc" : "asc";

  return {
    sortBy: normalizedSortBy,
    sortDir: normalizedSortDir,
  };
}

export function buildEmpresaOrderBy(sortBy?: string | null, sortDir?: string | null): Prisma.EmpresaOrderByWithRelationInput[] {
  const normalized = normalizeEmpresaSort(sortBy, sortDir);

  switch (normalized.sortBy) {
    case "id":
      return [{ id: normalized.sortDir }];
    case "cnpj":
      return [{ cnpj: normalized.sortDir }];
    case "categoria":
      return [{ categoria: { nome: normalized.sortDir } }];
    case "bairro":
      return [{ endereco: { bairro: normalized.sortDir } }];
    case "porte":
      return [{ porte: normalized.sortDir }];
    case "numeroEmpregados":
      return [{ numeroEmpregados: normalized.sortDir }];
    case "situacao":
      return [{ situacao: normalized.sortDir }];
    case "razaoSocial":
    default:
      return [{ razaoSocial: normalized.sortDir }, { id: "asc" }];
  }
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
