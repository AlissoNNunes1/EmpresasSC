import { prisma } from "@/lib/prisma";

export async function getConfiguracaoSistema() {
  const config = await prisma.configuracaoSistema.findFirst({
    include: {
      categoriaPadrao: true,
    },
    orderBy: { id: "asc" },
  });

  if (config) {
    return config;
  }

  return prisma.configuracaoSistema.create({
    data: {
      nomeSistema: "EmpresasSC",
      nomeMunicipio: "Sao Cristovao",
      emailInstitucional: "contato@empresassc.local",
    },
    include: {
      categoriaPadrao: true,
    },
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
