import { PorteEmpresa, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function refreshDashboardCacheViews(): Promise<void> {
  const categoriaRows = await prisma.empresa.groupBy({
    by: ["categoriaId"],
    _count: { _all: true },
    _sum: { numeroEmpregados: true },
  });

  const categoriaNames = await prisma.categoria.findMany({
    select: {
      id: true,
      nome: true,
    },
  });

  const categoryNameMap = new Map(categoriaNames.map((item) => [item.id, item.nome]));

  await prisma.$transaction(async (tx) => {
    await tx.resumoCategoriaView.deleteMany();
    await tx.resumoBairroView.deleteMany();
    await tx.resumoPorteView.deleteMany();

    for (const row of categoriaRows) {
      await tx.resumoCategoriaView.create({
        data: {
          categoria: categoryNameMap.get(row.categoriaId) ?? "Sem Categoria",
          totalEmpresas: row._count._all,
          totalEmpregados: row._sum.numeroEmpregados ?? 0,
        },
      });
    }

    const bairroRows = (await tx.$queryRaw`
      SELECT e.bairro AS bairro,
             COUNT(*) AS total_empresas,
             COALESCE(SUM(emp.numero_empregados), 0) AS total_empregados
      FROM enderecos e
      INNER JOIN empresas emp ON e.empresa_id = emp.id
      GROUP BY e.bairro
      ORDER BY total_empresas DESC
    `) as Array<{ bairro: string; total_empresas: bigint | number; total_empregados: bigint | number }>;

    for (const row of bairroRows) {
      await tx.resumoBairroView.create({
        data: {
          bairro: row.bairro,
          totalEmpresas: Number(row.total_empresas),
          totalEmpregados: Number(row.total_empregados),
        },
      });
    }

    const porteRows = await tx.empresa.groupBy({
      by: ["porte"],
      _count: { _all: true },
      _sum: { numeroEmpregados: true },
    });

    const knownPortes: PorteEmpresa[] = ["MEI", "MICRO", "PEQUENA", "MEDIA", "GRANDE"];

    for (const porte of knownPortes) {
      const row = porteRows.find((item) => item.porte === porte);
      await tx.resumoPorteView.create({
        data: {
          porte,
          totalEmpresas: row?._count._all ?? 0,
          totalEmpregados: row?._sum.numeroEmpregados ?? 0,
        },
      });
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
