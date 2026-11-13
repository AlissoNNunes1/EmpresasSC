// Revisão de possíveis duplicatas já cadastradas: monta os grupos e aplica as decisões do usuário.
import { prisma } from "@/lib/prisma";
import { encontrarPossiveisDuplicatas, type PossivelDuplicata, type RegistroComparavel } from "../empresa/duplicatas";
import { agruparPorComponente, chaveDoPar } from "./grupos";

export type MembroDuplicata = {
  id: number;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  categoria: string;
  atividadePrincipal: string;
  porte: string;
  numeroEmpregados: number;
  situacao: string;
  cep: string;
  logradouro: string;
  bairro: string;
  telefone: string;
  responsavel: string;
};

export type GrupoDuplicata = {
  chave: string;
  scoreMaximo: number;
  motivos: string[];
  membros: MembroDuplicata[];
};

export class RevisaoDuplicataError extends Error {}

type ParComIds = { a: number; b: number; score: number; motivos: string[] };

function comIds(possivel: PossivelDuplicata): ParComIds | null {
  const { a, b } = possivel;
  if (a.id === undefined || b.id === undefined) return null;
  return { a: a.id, b: b.id, score: possivel.score, motivos: possivel.motivos };
}

/** Todas as empresas, agrupadas por possível duplicidade, sem os pares já marcados como "não são duplicatas". */
export async function listarGruposDeDuplicatas(): Promise<GrupoDuplicata[]> {
  const [empresas, decisoes] = await Promise.all([
    prisma.empresa.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        cnpj: true,
        razaoSocial: true,
        nomeFantasia: true,
        atividadePrincipal: true,
        porte: true,
        numeroEmpregados: true,
        situacao: true,
        categoria: { select: { nome: true } },
        endereco: { select: { cep: true, logradouro: true, bairro: true } },
        responsaveis: { select: { nome: true, contato: true }, orderBy: { id: "asc" }, take: 1 },
      },
    }),
    prisma.duplicataDecisao.findMany({ select: { empresaAId: true, empresaBId: true } }),
  ]);

  const registros: RegistroComparavel[] = empresas.map((empresa) => ({
    id: empresa.id,
    ref: `empresa #${empresa.id}`,
    cnpj: empresa.cnpj,
    nome: empresa.razaoSocial,
    nomeFantasia: empresa.nomeFantasia,
    telefone: empresa.responsaveis[0]?.contato ?? "",
    logradouro: empresa.endereco?.logradouro ?? "",
  }));

  const naoDuplicatas = new Set(decisoes.map((d) => chaveDoPar(d.empresaAId, d.empresaBId)));
  const pares = encontrarPossiveisDuplicatas(registros, [])
    .map(comIds)
    .filter((par): par is ParComIds => par !== null && !naoDuplicatas.has(chaveDoPar(par.a, par.b)));

  const empresasPorId = new Map(empresas.map((empresa) => [empresa.id, empresa]));

  return agruparPorComponente(pares)
    .map((ids) => {
      const paresDoGrupo = pares.filter((par) => ids.includes(par.a));
      return {
        chave: ids.join("-"),
        scoreMaximo: Math.max(...paresDoGrupo.map((par) => par.score)),
        motivos: [...new Set(paresDoGrupo.flatMap((par) => par.motivos))],
        membros: ids.map((id) => {
          const empresa = empresasPorId.get(id)!;
          return {
            id,
            cnpj: empresa.cnpj,
            razaoSocial: empresa.razaoSocial,
            nomeFantasia: empresa.nomeFantasia,
            categoria: empresa.categoria.nome,
            atividadePrincipal: empresa.atividadePrincipal,
            porte: empresa.porte,
            numeroEmpregados: empresa.numeroEmpregados,
            situacao: empresa.situacao,
            cep: empresa.endereco?.cep ?? "",
            logradouro: empresa.endereco?.logradouro ?? "",
            bairro: empresa.endereco?.bairro ?? "",
            telefone: empresa.responsaveis[0]?.contato ?? "",
            responsavel: empresa.responsaveis[0]?.nome ?? "",
          };
        }),
      };
    })
    .sort((x, y) => y.scoreMaximo - x.scoreMaximo);
}

async function garantirEmpresasExistem(ids: number[]): Promise<void> {
  const encontradas = await prisma.empresa.count({ where: { id: { in: ids } } });
  if (encontradas !== ids.length) {
    throw new RevisaoDuplicataError("Alguma empresa selecionada não existe mais. Atualize a página.");
  }
}

/** Marca todos os pares do grupo como "não são duplicatas". Retorna quantos pares foram registrados. */
export async function marcarComoNaoDuplicatas(empresaIds: number[]): Promise<number> {
  const ids = [...new Set(empresaIds)];
  if (ids.length < 2) throw new RevisaoDuplicataError("Informe ao menos duas empresas.");
  await garantirEmpresasExistem(ids);

  const operacoes = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const [empresaAId, empresaBId] = ids[i] < ids[j] ? [ids[i], ids[j]] : [ids[j], ids[i]];
      operacoes.push(
        prisma.duplicataDecisao.upsert({
          where: { empresaAId_empresaBId: { empresaAId, empresaBId } },
          create: { empresaAId, empresaBId },
          update: {},
        }),
      );
    }
  }

  await prisma.$transaction(operacoes);
  return operacoes.length;
}

/** Mantém uma empresa e exclui as outras. Exclusão cascateia endereço, responsáveis e campos customizados. */
export async function manterEExcluirDemais(manterId: number, removerIds: number[]): Promise<number> {
  const ids = [...new Set(removerIds)].filter((id) => id !== manterId);
  if (ids.length === 0) throw new RevisaoDuplicataError("Nenhuma empresa para remover.");
  await garantirEmpresasExistem([manterId, ...ids]);

  const { count } = await prisma.empresa.deleteMany({ where: { id: { in: ids } } });
  return count;
}
