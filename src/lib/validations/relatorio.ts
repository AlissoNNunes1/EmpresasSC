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

// Dimensões base fixas do sistema
export const BASE_DIMENSIONS = ["segmento", "categoria", "porte", "situacao", "bairro"] as const;
export type BaseDimension = typeof BASE_DIMENSIONS[number];

// Dimensões dinâmicas de campos customizados: "campo_<id>"
// Métricas dinâmicas de campos numéricos customizados: "camponum_<id>"
export type GroupBy = BaseDimension | `campo_${number}`;
export type Metrica = "totalEmpresas" | "totalEmpregados" | "mediaEmpregados" | `camponum_${number}`;

function isValidGroupBy(val: string): val is GroupBy {
  return (BASE_DIMENSIONS as readonly string[]).includes(val) || /^campo_\d+$/.test(val);
}

function isValidMetrica(val: string): val is Metrica {
  return (
    ["totalEmpresas", "totalEmpregados", "mediaEmpregados"].includes(val) ||
    /^camponum_\d+$/.test(val)
  );
}

export const relatorioQuerySchema = z.object({
  groupBy: z.string().refine(isValidGroupBy, { message: "Dimensão inválida" }),
  metrica: z.string().refine(isValidMetrica, { message: "Métrica inválida" }),
  situacao: optionalEnumFromForm(["ATIVA", "INATIVA", "SUSPENSA", "ENCERRADA"]),
  porte: optionalEnumFromForm(["MEI", "MICRO", "PEQUENA", "MEDIA", "GRANDE"]),
  categoriaId: optionalPositiveIntFromForm(),
  segmentoId: optionalPositiveIntFromForm(),
});

export type RelatorioQueryInput = z.infer<typeof relatorioQuerySchema> & {
  groupBy: GroupBy;
  metrica: Metrica;
};

export type RelatorioRow = { label: string; value: number };

export type RelatorioQueryResult = {
  rows: RelatorioRow[];
  total: number;
  groupBy: string;
  metrica: string;
};

// Definição de uma dimensão disponível (base ou campo customizado)
export type DimensaoConfig = {
  key: GroupBy;
  label: string;
  tipo: "base" | "campo_select";
};

// Definição de uma métrica disponível (base ou campo numérico customizado)
export type MetricaConfig = {
  key: Metrica;
  label: string;
  tipo: "base" | "campo_numero";
};

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
