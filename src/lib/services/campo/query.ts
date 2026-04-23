import { prisma } from "@/lib/prisma";

const CAMPOS_BUILTIN = [
  { nome: "razaoSocial",        label: "Razão Social",        tipo: "TEXTO",    obrigatorio: true,  visivel: true, ordem: 1  },
  { nome: "nomeFantasia",       label: "Nome Fantasia",       tipo: "TEXTO",    obrigatorio: false, visivel: true, ordem: 2  },
  { nome: "cnpj",               label: "CNPJ",                tipo: "TEXTO",    obrigatorio: true,  visivel: true, ordem: 3  },
  { nome: "porte",              label: "Porte",               tipo: "SELECT",   obrigatorio: true,  visivel: true, ordem: 4  },
  { nome: "categoriaId",        label: "Categoria",           tipo: "SELECT",   obrigatorio: true,  visivel: true, ordem: 5  },
  { nome: "atividadePrincipal", label: "Atividade Principal", tipo: "TEXTO",    obrigatorio: true,  visivel: true, ordem: 6  },
  { nome: "numeroEmpregados",   label: "Nº de Empregados",    tipo: "NUMERO",   obrigatorio: true,  visivel: true, ordem: 7  },
  { nome: "situacao",           label: "Situação",            tipo: "SELECT",   obrigatorio: true,  visivel: true, ordem: 8  },
  { nome: "enderecoCep",        label: "CEP",                 tipo: "TEXTO",    obrigatorio: true,  visivel: true, ordem: 9  },
  { nome: "enderecoBairro",     label: "Bairro",              tipo: "TEXTO",    obrigatorio: true,  visivel: true, ordem: 10 },
  { nome: "enderecoLogradouro", label: "Logradouro",          tipo: "TEXTO",    obrigatorio: true,  visivel: true, ordem: 11 },
] as const;

export async function getOrInitCampos() {
  const count = await prisma.campoEmpresa.count();

  if (count === 0) {
    await prisma.campoEmpresa.createMany({
      data: CAMPOS_BUILTIN.map((c) => ({ ...c, builtin: true })),
    });
  }

  return prisma.campoEmpresa.findMany({ orderBy: { ordem: "asc" } });
}

export async function getCamposVisiveis() {
  await getOrInitCampos();
  return prisma.campoEmpresa.findMany({
    where: { visivel: true },
    orderBy: { ordem: "asc" },
  });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
