import { prisma } from "@/lib/prisma";
import type { GroupBy, Metrica, RelatorioQueryInput, RelatorioRow } from "@/lib/validations/relatorio";
import type { PorteEmpresa, SituacaoEmpresa } from "@prisma/client";

// ── helpers ───────────────────────────────────────────────────────────────────

function pickValue(
  metrica: Metrica,
  count: number,
  sum: number | null | undefined,
  avg: number | null | undefined,
): number {
  if (metrica === "totalEmpresas") return count;
  if (metrica === "totalEmpregados") return sum ?? 0;
  if (metrica === "mediaEmpregados") return avg != null ? Math.round(avg * 10) / 10 : 0;
  return count; // fallback para campo numérico (tratado separadamente)
}

function buildWhere(params: RelatorioQueryInput) {
  const isCampoGroupBy = params.groupBy.startsWith("campo_");
  return {
    ...(params.situacao && params.groupBy !== "situacao" ? { situacao: params.situacao as SituacaoEmpresa } : {}),
    ...(params.porte && params.groupBy !== "porte" ? { porte: params.porte as PorteEmpresa } : {}),
    ...(params.categoriaId && params.groupBy !== "categoria" ? { categoriaId: params.categoriaId } : {}),
    ...(params.segmentoId && params.groupBy !== "segmento" ? { segmentoId: params.segmentoId } : {}),
  };
}

// Constrói condições WHERE para $queryRaw
function buildRawConditions(params: RelatorioQueryInput, tableAlias = "emp"): { clause: string; args: (string | number)[] } {
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (params.situacao && params.groupBy !== "situacao") {
    conditions.push(`${tableAlias}.situacao = ?`);
    args.push(params.situacao);
  }
  if (params.porte && params.groupBy !== "porte") {
    conditions.push(`${tableAlias}.porte = ?`);
    args.push(params.porte);
  }
  if (params.categoriaId && params.groupBy !== "categoria") {
    conditions.push(`${tableAlias}.categoria_id = ?`);
    args.push(params.categoriaId);
  }
  if (params.segmentoId && params.groupBy !== "segmento") {
    conditions.push(`${tableAlias}.segmento_id = ?`);
    args.push(params.segmentoId);
  }

  return {
    clause: conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "",
    args,
  };
}

// ── handlers por dimensão ─────────────────────────────────────────────────────

async function queryByPorte(params: RelatorioQueryInput): Promise<RelatorioRow[]> {
  const where = buildWhere(params);
  const rows = await prisma.empresa.groupBy({
    by: ["porte"],
    where,
    _count: { _all: true },
    _sum: { numeroEmpregados: true },
    _avg: { numeroEmpregados: true },
  });
  return rows
    .map((r) => ({
      label: r.porte as string,
      value: pickValue(params.metrica, r._count._all, r._sum.numeroEmpregados, r._avg.numeroEmpregados),
    }))
    .sort((a, b) => b.value - a.value);
}

async function queryBySituacao(params: RelatorioQueryInput): Promise<RelatorioRow[]> {
  const where = buildWhere(params);
  const rows = await prisma.empresa.groupBy({
    by: ["situacao"],
    where,
    _count: { _all: true },
    _sum: { numeroEmpregados: true },
    _avg: { numeroEmpregados: true },
  });
  return rows
    .map((r) => ({
      label: r.situacao as string,
      value: pickValue(params.metrica, r._count._all, r._sum.numeroEmpregados, r._avg.numeroEmpregados),
    }))
    .sort((a, b) => b.value - a.value);
}

async function queryByCategoria(params: RelatorioQueryInput): Promise<RelatorioRow[]> {
  const where = buildWhere(params);
  const rows = await prisma.empresa.groupBy({
    by: ["categoriaId"],
    where,
    _count: { _all: true },
    _sum: { numeroEmpregados: true },
    _avg: { numeroEmpregados: true },
  });
  const cats = await prisma.categoria.findMany({
    where: { id: { in: rows.map((r) => r.categoriaId) } },
    select: { id: true, nome: true },
  });
  const nameMap = new Map(cats.map((c) => [c.id, c.nome]));
  return rows
    .map((r) => ({
      label: nameMap.get(r.categoriaId) ?? `Categoria ${r.categoriaId}`,
      value: pickValue(params.metrica, r._count._all, r._sum.numeroEmpregados, r._avg.numeroEmpregados),
    }))
    .sort((a, b) => b.value - a.value);
}

async function queryBySegmento(params: RelatorioQueryInput): Promise<RelatorioRow[]> {
  const where = buildWhere(params);
  const rows = await prisma.empresa.groupBy({
    by: ["segmentoId"],
    where,
    _count: { _all: true },
    _sum: { numeroEmpregados: true },
    _avg: { numeroEmpregados: true },
  });
  const segs = await prisma.segmento.findMany({
    where: { id: { in: rows.map((r) => r.segmentoId).filter((id): id is number => id !== null) } },
    select: { id: true, nome: true },
  });
  const nameMap = new Map(segs.map((s) => [s.id, s.nome]));
  return rows
    .map((r) => ({
      label: r.segmentoId ? (nameMap.get(r.segmentoId) ?? `Segmento ${r.segmentoId}`) : "Sem segmento",
      value: pickValue(params.metrica, r._count._all, r._sum.numeroEmpregados, r._avg.numeroEmpregados),
    }))
    .sort((a, b) => b.value - a.value);
}

async function queryByBairro(params: RelatorioQueryInput): Promise<RelatorioRow[]> {
  const { clause, args } = buildRawConditions(params);
  type Row = { label: string; cnt: bigint | number; sum_emp: bigint | number; avg_emp: number | null };
  const raw = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT e.bairro AS label,
            COUNT(*) AS cnt,
            COALESCE(SUM(emp.numero_empregados), 0) AS sum_emp,
            AVG(emp.numero_empregados) AS avg_emp
     FROM enderecos e
     INNER JOIN empresas emp ON e.empresa_id = emp.id
     WHERE 1=1 ${clause}
     GROUP BY e.bairro
     ORDER BY cnt DESC`,
    ...args,
  );
  return raw.map((r) => ({
    label: r.label,
    value: pickValue(params.metrica, Number(r.cnt), Number(r.sum_emp), r.avg_emp != null ? Number(r.avg_emp) : null),
  }));
}

// Campo customizado SELECT: agrupa pelo valor do campo
async function queryByCampoCustom(params: RelatorioQueryInput, campoId: number): Promise<RelatorioRow[]> {
  const { clause, args } = buildRawConditions(params);
  type Row = { label: string; cnt: bigint | number; sum_emp: bigint | number; avg_emp: number | null };
  const raw = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT COALESCE(vcfe.valor, 'Não informado') AS label,
            COUNT(DISTINCT emp.id) AS cnt,
            COALESCE(SUM(emp.numero_empregados), 0) AS sum_emp,
            AVG(emp.numero_empregados) AS avg_emp
     FROM empresas emp
     LEFT JOIN valores_campos_empresa vcfe
       ON vcfe.empresa_id = emp.id AND vcfe.campo_id = ?
     WHERE 1=1 ${clause}
     GROUP BY vcfe.valor
     ORDER BY cnt DESC`,
    campoId,
    ...args,
  );
  return raw.map((r) => ({
    label: r.label ?? "Não informado",
    value: pickValue(params.metrica, Number(r.cnt), Number(r.sum_emp), r.avg_emp != null ? Number(r.avg_emp) : null),
  }));
}

// Campo numérico personalizado como métrica (soma/média do valor do campo por agrupamento base)
// Neste caso o groupBy é um dos valores base, mas a métrica é o valor de um campo numérico.
// Delegamos ao handler da dimensão base, mas substituímos o metrica por "totalEmpresas" para obter os counts,
// e fazemos uma segunda query para somar o campo numérico.
async function queryWithMetricaCampoNumerico(params: RelatorioQueryInput, metricaCampoId: number): Promise<RelatorioRow[]> {
  // Obtem os rows com agrupamento base (usando totalEmpresas como proxy de count)
  const baseParams = { ...params, metrica: "totalEmpresas" as Metrica };
  const baseRows = await runRelatorioQuery(baseParams);

  if (baseRows.length === 0) return [];

  // Para cada label (grupo), soma o valor numérico do campo
  const { clause, args: baseArgs } = buildRawConditions(params);

  type NumRow = { label: string; soma: number | null; media: number | null };

  // Mapeia de acordo com a dimensão para construir o SELECT correto
  let groupExpr = "";
  const groupBy = params.groupBy;
  if (groupBy === "porte") groupExpr = "emp.porte";
  else if (groupBy === "situacao") groupExpr = "emp.situacao";
  else if (groupBy === "segmento") groupExpr = "COALESCE(CAST(emp.segmento_id AS TEXT), 'Sem segmento')";
  else if (groupBy === "categoria") groupExpr = "CAST(emp.categoria_id AS TEXT)";
  else return baseRows; // bairro e campo_N não suportam métrica de campo numérico ainda

  const numRows = await prisma.$queryRawUnsafe<NumRow[]>(
    `SELECT ${groupExpr} AS label,
            SUM(CAST(COALESCE(vcfe.valor, '0') AS REAL)) AS soma,
            AVG(CAST(COALESCE(vcfe.valor, '0') AS REAL)) AS media
     FROM empresas emp
     LEFT JOIN valores_campos_empresa vcfe
       ON vcfe.empresa_id = emp.id AND vcfe.campo_id = ?
     WHERE 1=1 ${clause}
     GROUP BY ${groupExpr}`,
    metricaCampoId,
    ...baseArgs,
  );

  const metricaKey = params.metrica; // "camponum_N"
  const isMedia = metricaKey.includes("media");

  const numMap = new Map(numRows.map((r) => [r.label, isMedia ? (r.media ?? 0) : (r.soma ?? 0)]));

  return baseRows.map((r) => ({
    label: r.label,
    value: Math.round((numMap.get(r.label) ?? 0) * 10) / 10,
  })).sort((a, b) => b.value - a.value);
}

// ── dispatcher principal ──────────────────────────────────────────────────────

export async function runRelatorioQuery(params: RelatorioQueryInput): Promise<RelatorioRow[]> {
  const { groupBy, metrica } = params;

  // Métrica de campo numérico customizado — delega com substituição
  if (metrica.startsWith("camponum_")) {
    const campoId = Number(metrica.replace("camponum_", ""));
    if (Number.isFinite(campoId)) {
      return queryWithMetricaCampoNumerico(params, campoId);
    }
  }

  // Dimensão de campo customizado SELECT
  if (groupBy.startsWith("campo_")) {
    const campoId = Number(groupBy.replace("campo_", ""));
    if (Number.isFinite(campoId)) return queryByCampoCustom(params, campoId);
  }

  // Dimensões base
  if (groupBy === "porte") return queryByPorte(params);
  if (groupBy === "situacao") return queryBySituacao(params);
  if (groupBy === "categoria") return queryByCategoria(params);
  if (groupBy === "segmento") return queryBySegmento(params);
  return queryByBairro(params); // default: bairro
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
