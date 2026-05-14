import { z } from "zod";

function optionalEnumFromForm<T extends [string, ...string[]]>(values: T) {
  return z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return value;
  }, z.enum(values).optional());
}

function optionalPositiveIntFromForm() {
  return z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return value;
  }, z.coerce.number().int().positive().optional());
}

export const relatorioQuerySchema = z.object({
  groupBy: z.enum(["categoria", "porte", "situacao", "bairro"]),
  metrica: z.enum(["totalEmpresas", "totalEmpregados", "mediaEmpregados"]),
  situacao: optionalEnumFromForm(["ATIVA", "INATIVA", "SUSPENSA", "ENCERRADA"]),
  porte: optionalEnumFromForm(["MEI", "MICRO", "PEQUENA", "MEDIA", "GRANDE"]),
  categoriaId: optionalPositiveIntFromForm(),
});

export type RelatorioQueryInput = z.infer<typeof relatorioQuerySchema>;

export type RelatorioRow = { label: string; value: number };

export type RelatorioQueryResult = {
  rows: RelatorioRow[];
  total: number;
  groupBy: string;
  metrica: string;
};

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
