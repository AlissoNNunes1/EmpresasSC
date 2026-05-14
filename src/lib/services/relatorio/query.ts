import { prisma } from "@/lib/prisma";
import type { RelatorioQueryInput, RelatorioRow } from "@/lib/validations/relatorio";
import type { PorteEmpresa, SituacaoEmpresa } from "@prisma/client";

function pickValue(
  metrica: RelatorioQueryInput["metrica"],
  count: number,
  sum: number | null | undefined,
  avg: number | null | undefined,
): number {
  if (metrica === "totalEmpresas") return count;
  if (metrica === "totalEmpregados") return sum ?? 0;
  return avg != null ? Math.round(avg * 10) / 10 : 0;
}

function buildWhere(params: RelatorioQueryInput) {
  return {
    ...(params.situacao && params.groupBy !== "situacao"
      ? { situacao: params.situacao as SituacaoEmpresa }
      : {}),
    ...(params.porte && params.groupBy !== "porte"
      ? { porte: params.porte as PorteEmpresa }
      : {}),
    ...(params.categoriaId && params.groupBy !== "categoria"
      ? { categoriaId: params.categoriaId }
      : {}),
  };
}

export async function runRelatorioQuery(params: RelatorioQueryInput): Promise<RelatorioRow[]> {
  const { groupBy, metrica } = params;
  const where = buildWhere(params);

  if (groupBy === "porte") {
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
        value: pickValue(metrica, r._count._all, r._sum.numeroEmpregados, r._avg.numeroEmpregados),
      }))
      .sort((a, b) => b.value - a.value);
  }

  if (groupBy === "situacao") {
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
        value: pickValue(metrica, r._count._all, r._sum.numeroEmpregados, r._avg.numeroEmpregados),
      }))
      .sort((a, b) => b.value - a.value);
  }

  if (groupBy === "categoria") {
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
        value: pickValue(metrica, r._count._all, r._sum.numeroEmpregados, r._avg.numeroEmpregados),
      }))
      .sort((a, b) => b.value - a.value);
  }

  // groupBy === "bairro" — needs JOIN via $queryRawUnsafe
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (params.situacao) { conditions.push(`emp.situacao = ?`); args.push(params.situacao); }
  if (params.porte) { conditions.push(`emp.porte = ?`); args.push(params.porte); }
  if (params.categoriaId) { conditions.push(`emp.categoria_id = ?`); args.push(params.categoriaId); }

  const whereClause = conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

  type BairroRaw = { label: string; cnt: bigint | number; sum_emp: bigint | number; avg_emp: number | null };

  const raw = await prisma.$queryRawUnsafe<BairroRaw[]>(
    `SELECT e.bairro AS label,
            COUNT(*) AS cnt,
            COALESCE(SUM(emp.numero_empregados), 0) AS sum_emp,
            AVG(emp.numero_empregados) AS avg_emp
     FROM enderecos e
     INNER JOIN empresas emp ON e.empresa_id = emp.id
     WHERE 1=1 ${whereClause}
     GROUP BY e.bairro
     ORDER BY cnt DESC`,
    ...args,
  );

  return raw.map((r) => ({
    label: r.label,
    value: pickValue(
      metrica,
      Number(r.cnt),
      Number(r.sum_emp),
      r.avg_emp != null ? Number(r.avg_emp) : null,
    ),
  }));
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
