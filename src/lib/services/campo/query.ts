import { prisma } from "@/lib/prisma";

const CAMPOS_BUILTIN = [
  { nome: "razaoSocial",        label: "Razão Social",        tipo: "TEXTO",    obrigatorio: true,  visivel: true, ordem: 1  },
  { nome: "nomeFantasia",       label: "Nome Fantasia",       tipo: "TEXTO",    obrigatorio: false, visivel: true, ordem: 2  },
  { nome: "cnpj",               label: "CNPJ",                tipo: "TEXTO",    obrigatorio: true,  visivel: true, ordem: 3  },
  { nome: "porte",              label: "Porte",               tipo: "SELECT",   obrigatorio: true,  visivel: true, ordem: 4  },
  { nome: "categoriaId",        label: "Categoria",           tipo: "SELECT",   obrigatorio: true,  visivel: true, ordem: 5  },
  { nome: "atividadePrincipal", label: "Atividade Principal", tipo: "SELECT",   obrigatorio: true,  visivel: true, ordem: 6  },
  { nome: "numeroEmpregados",   label: "Nº de Empregados",    tipo: "NUMERO",   obrigatorio: true,  visivel: true, ordem: 7  },
  { nome: "situacao",           label: "Situação",            tipo: "SELECT",   obrigatorio: true,  visivel: true, ordem: 8  },
  { nome: "enderecoCep",        label: "CEP",                 tipo: "TEXTO",    obrigatorio: true,  visivel: true, ordem: 9  },
  { nome: "enderecoBairro",     label: "Bairro/Povoado",      tipo: "SELECT",   obrigatorio: true,  visivel: true, ordem: 10 },
  { nome: "enderecoLogradouro", label: "Logradouro",          tipo: "TEXTO",    obrigatorio: true,  visivel: true, ordem: 11 },
] as const;

const CAMPOS_SELECT_BUILTIN = {
  atividadePrincipal: {
    defaults: ["Comércio", "Serviços", "Indústria", "Agricultura", "Educação", "Saúde", "Tecnologia"],
  },
  enderecoBairro: {
    defaults: ["Centro", "Zona Rural", "Povoado"],
  },
} as const;

function uniqueValores(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

async function getSelectOptionsFromData() {
  const [atividadeValues, bairroValues] = await Promise.all([
    prisma.empresa.findMany({
      distinct: ["atividadePrincipal"],
      select: { atividadePrincipal: true },
      orderBy: { atividadePrincipal: "asc" },
    }),
    prisma.endereco.findMany({
      distinct: ["bairro"],
      select: { bairro: true },
      orderBy: { bairro: "asc" },
    }),
  ]);

  return {
    atividadePrincipal: uniqueValores([
      ...CAMPOS_SELECT_BUILTIN.atividadePrincipal.defaults,
      ...atividadeValues.map((item) => item.atividadePrincipal),
    ]),
    enderecoBairro: uniqueValores([
      ...CAMPOS_SELECT_BUILTIN.enderecoBairro.defaults,
      ...bairroValues.map((item) => item.bairro),
    ]),
  };
}

function serializeSelectOptions(values: readonly string[]): string {
  return JSON.stringify(uniqueValores(values));
}

async function syncBuiltinSelectFields() {
  const [campos, selectOptions] = await Promise.all([
    prisma.campoEmpresa.findMany({
      where: {
        nome: {
          in: ["atividadePrincipal", "enderecoBairro"],
        },
      },
    }),
    getSelectOptionsFromData(),
  ]);

  const campoPorNome = new Map(campos.map((campo) => [campo.nome, campo] as const));
  const updates: Promise<unknown>[] = [];

  const atividadeCampo = campoPorNome.get("atividadePrincipal");
  if (atividadeCampo && (atividadeCampo.tipo !== "SELECT" || !atividadeCampo.opcoes)) {
    updates.push(
      prisma.campoEmpresa.update({
        where: { id: atividadeCampo.id },
        data: {
          tipo: "SELECT",
          opcoes: serializeSelectOptions(selectOptions.atividadePrincipal),
        },
      })
    );
  }

  const bairroCampo = campoPorNome.get("enderecoBairro");
  if (bairroCampo && (bairroCampo.tipo !== "SELECT" || !bairroCampo.opcoes)) {
    updates.push(
      prisma.campoEmpresa.update({
        where: { id: bairroCampo.id },
        data: {
          label: bairroCampo.label === "Bairro" ? "Bairro/Povoado" : bairroCampo.label,
          tipo: "SELECT",
          opcoes: serializeSelectOptions(selectOptions.enderecoBairro),
        },
      })
    );
  }

  if (updates.length > 0) {
    await Promise.all(updates);
  }
}

export async function getOrInitCampos() {
  const count = await prisma.campoEmpresa.count();

  if (count === 0) {
    await prisma.campoEmpresa.createMany({
      data: CAMPOS_BUILTIN.map((c) => {
        if (c.nome === "atividadePrincipal") {
          return {
            ...c,
            builtin: true,
            opcoes: serializeSelectOptions(CAMPOS_SELECT_BUILTIN.atividadePrincipal.defaults),
          };
        }

        if (c.nome === "enderecoBairro") {
          return {
            ...c,
            builtin: true,
            opcoes: serializeSelectOptions(CAMPOS_SELECT_BUILTIN.enderecoBairro.defaults),
          };
        }

        return { ...c, builtin: true };
      }),
    });
  } else {
    await syncBuiltinSelectFields();
  }

  return prisma.campoEmpresa.findMany({ orderBy: { ordem: "asc" } });
}

export async function getCamposVisiveis(segmentoId?: number) {
  await getOrInitCampos();

  if (segmentoId === undefined) {
    // Comportamento global (sem segmento): todos os campos globais visíveis
    return prisma.campoEmpresa.findMany({
      where: { visivel: true, segmentoId: null },
      orderBy: { ordem: "asc" },
    });
  }

  // Carrega campos globais visíveis + overrides do segmento + campos exclusivos do segmento
  const [globais, overrides, exclusivos] = await Promise.all([
    prisma.campoEmpresa.findMany({
      where: { visivel: true, segmentoId: null },
      orderBy: { ordem: "asc" },
    }),
    prisma.segmentoCampoConfig.findMany({ where: { segmentoId } }),
    prisma.campoEmpresa.findMany({
      where: { visivel: true, segmentoId },
      orderBy: { ordem: "asc" },
    }),
  ]);

  const overrideMap = new Map(overrides.map((o) => [o.campoId, o.ativo]));

  // Aplica overrides: exclui campos onde existe override com ativo = false
  const globaisFiltrados = globais.filter((c) => {
    const override = overrideMap.get(c.id);
    return override === undefined ? true : override;
  });

  return [...globaisFiltrados, ...exclusivos];
}

export async function getCamposDoSegmento(segmentoId: number) {
  return prisma.campoEmpresa.findMany({
    where: { segmentoId },
    orderBy: { ordem: "asc" },
  });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/


