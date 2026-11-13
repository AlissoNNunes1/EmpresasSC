// Job de normalização das empresas já cadastradas.
// Roda em lotes pequenos com pausa entre eles, para não competir com o uso do sistema.
// Sem interface: o resultado vai para o log e para GET /api/admin/normalizacao.
import { prisma } from "@/lib/prisma";
import { refreshDashboardCacheViews } from "@/lib/services/dashboard/refresh";
import { criarBuscadoresDeEnderecos } from "../endereco/consulta";
import { completarEndereco, type BuscadoresEndereco } from "../endereco/regras";
import { planejarNormalizacao, type EmpresaParaNormalizar } from "./planejar";

const TAMANHO_LOTE = 25;
const PAUSA_ENTRE_LOTES_MS = 1000;

export type ResultadoNormalizacao = {
  iniciadoEm: string;
  finalizadoEm: string | null;
  analisadas: number;
  atualizadas: number;
  enderecosCompletados: number;
  falhas: number;
};

function pausa(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function normalizarEmpresa(
  empresa: EmpresaParaNormalizar,
  buscadores: BuscadoresEndereco,
  resultado: ResultadoNormalizacao,
): Promise<void> {
  const endereco = empresa.endereco
    ? await completarEndereco(empresa.endereco, buscadores)
    : null;

  const mudancas = planejarNormalizacao(empresa, endereco);
  if (!mudancas) return;

  await prisma.empresa.update({
    where: { id: empresa.id },
    data: {
      razaoSocial: mudancas.razaoSocial,
      nomeFantasia: mudancas.nomeFantasia,
      atividadePrincipal: mudancas.atividadePrincipal,
      endereco: mudancas.endereco ? { update: mudancas.endereco } : undefined,
    },
  });

  resultado.atualizadas += 1;
  if (endereco?.origem) resultado.enderecosCompletados += 1;
}

/** Percorre todas as empresas em ordem de id. Pode ser chamado direto (script) ou via iniciarNormalizacao. */
export async function executarNormalizacao(): Promise<ResultadoNormalizacao> {
  const resultado: ResultadoNormalizacao = {
    iniciadoEm: new Date().toISOString(),
    finalizadoEm: null,
    analisadas: 0,
    atualizadas: 0,
    enderecosCompletados: 0,
    falhas: 0,
  };

  // Cache de consultas de CEP/logradouro: cada um é consultado uma vez por execução.
  const buscadores = criarBuscadoresDeEnderecos();
  let ultimoId = 0;

  for (;;) {
    const lote = await prisma.empresa.findMany({
      where: { id: { gt: ultimoId } },
      orderBy: { id: "asc" },
      take: TAMANHO_LOTE,
      select: {
        id: true,
        razaoSocial: true,
        nomeFantasia: true,
        atividadePrincipal: true,
        endereco: { select: { cep: true, logradouro: true, bairro: true } },
      },
    });
    if (lote.length === 0) break;

    for (const empresa of lote) {
      ultimoId = empresa.id;
      resultado.analisadas += 1;
      try {
        await normalizarEmpresa(empresa, buscadores, resultado);
      } catch (erro) {
        resultado.falhas += 1;
        console.error(`[normalizacao] empresa ${empresa.id} falhou:`, erro);
      }
    }

    await pausa(PAUSA_ENTRE_LOTES_MS);
  }

  if (resultado.atualizadas > 0) {
    // Views de resumo por bairro/categoria/porte precisam refletir os novos endereços.
    await refreshDashboardCacheViews().catch((erro) => {
      console.error("[normalizacao] falha ao atualizar views do dashboard:", erro);
    });
  }

  resultado.finalizadoEm = new Date().toISOString();
  console.info("[normalizacao] concluída:", resultado);
  return resultado;
}

// ── execução única em background ─────────────────────────────────────────────
// Um processo roda uma normalização por vez. Chamadas enquanto houver uma em andamento são ignoradas.

let execucaoAtual: Promise<void> | null = null;
let ultimoResultado: ResultadoNormalizacao | null = null;

export function normalizacaoEmAndamento(): boolean {
  return execucaoAtual !== null;
}

export function ultimoResultadoNormalizacao(): ResultadoNormalizacao | null {
  return ultimoResultado;
}

/** Dispara a normalização sem bloquear quem chamou. Retorna false se já estiver rodando. */
export function iniciarNormalizacao(): boolean {
  if (execucaoAtual) return false;

  execucaoAtual = executarNormalizacao()
    .then((resultado) => {
      ultimoResultado = resultado;
    })
    .catch((erro) => {
      console.error("[normalizacao] falhou:", erro);
    })
    .finally(() => {
      execucaoAtual = null;
    });

  return true;
}
