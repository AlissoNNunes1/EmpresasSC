import { prisma } from "@/lib/prisma";

export async function getDashboardResumo() {
  const [categoria, bairro, porte, totalEmpresas, empregados] = await Promise.all([
    prisma.resumoCategoriaView.findMany({ orderBy: { totalEmpresas: "desc" } }),
    prisma.resumoBairroView.findMany({ orderBy: { totalEmpresas: "desc" } }),
    prisma.resumoPorteView.findMany({ orderBy: { totalEmpresas: "desc" } }),
    prisma.empresa.count(),
    prisma.empresa.aggregate({
      _sum: {
        numeroEmpregados: true,
      },
    }),
  ]);

  return {
    totalEmpresas,
    totalEmpregados: empregados._sum.numeroEmpregados ?? 0,
    categoria,
    bairro,
    porte,
  };
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
