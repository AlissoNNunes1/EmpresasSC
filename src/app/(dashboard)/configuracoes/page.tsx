import { ConfigPanel } from "@/components/configuracoes/config-panel";
import { ConfigReatribuicaoSegmento } from "@/components/configuracoes/config-reatribuicao-segmento";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrInitCampos } from "@/lib/services/campo/query";
import { getConfiguracaoSistema } from "@/lib/services/configuracao/query";
import { PapelUsuario } from "@prisma/client";
import { Cog, Layers } from "lucide-react";
import { getServerSession } from "next-auth";
import type { CampoEmpresaConfig } from "@/services/campos.service";

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? PapelUsuario.VISUALIZADOR;

  if (role !== PapelUsuario.ADMIN) {
    return (
      <main className="space-y-6">
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-bold text-amber-800">Acesso restrito</h2>
          <p className="mt-2 text-sm text-amber-700">
            Somente usuários admin podem alterar configuracões do sistema.
          </p>
        </section>
      </main>
    );
  }

  const [config, categorias, campos, segmentos, empresasSemSegmento] = await Promise.all([
    getConfiguracaoSistema(),
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
    getOrInitCampos(),
    prisma.segmento.findMany({ orderBy: { ordem: "asc" } }),
    prisma.empresa.count({ where: { segmentoId: null } }),
  ]);

  return (
    <main className="space-y-8">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Sistema</p>
            <h2 className="text-2xl font-bold text-[#1b3383]">Configurações</h2>
            <p className="text-sm text-slate-600">
              Defina parâmetros operacionais, políticas de acesso e preferências de plataforma.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#f0f3fa] px-3 py-2 text-sm font-semibold text-[#1b3383]">
            <Cog className="h-4 w-4" />
            Ambiente Controlado
          </div>
        </div>
      </section>

      <ConfigPanel
        initialConfig={{
          id: config.id,
          nomeSistema: config.nomeSistema,
          nomeMunicipio: config.nomeMunicipio,
          logoUrl: config.logoUrl,
          emailInstitucional: config.emailInstitucional,
          minEmpregadosPequena: config.minEmpregadosPequena,
          maxEmpregadosPequena: config.maxEmpregadosPequena,
          minEmpregadosMedia: config.minEmpregadosMedia,
          maxEmpregadosMedia: config.maxEmpregadosMedia,
          categoriaPadraoId: config.categoriaPadraoId,
          politicaSenhaMinCaracteres: config.politicaSenhaMinCaracteres,
          tempoSessaoMinutos: config.tempoSessaoMinutos,
          controleLoginAtivo: config.controleLoginAtivo,
          integracaoCnpjAtiva: config.integracaoCnpjAtiva,
          webhookUrl: config.webhookUrl,
          criadoEm: config.criadoEm.toISOString(),
          atualizadoEm: config.atualizadoEm.toISOString(),
        }}
        initialCategorias={categorias.map((item) => ({
          id: item.id,
          nome: item.nome,
          status: item.ativo ? "ATIVO" : "INATIVO",
          criadoEm: item.criadoEm.toISOString(),
          atualizadoEm: item.atualizadoEm.toISOString(),
        }))}
        initialCampos={campos.map((c) => ({
          id: c.id,
          nome: c.nome,
          label: c.label,
          tipo: c.tipo as CampoEmpresaConfig["tipo"],
          builtin: c.builtin,
          obrigatorio: c.obrigatorio,
          visivel: c.visivel,
          ordem: c.ordem,
          opcoes: c.opcoes,
          criadoEm: c.criadoEm.toISOString(),
          atualizadoEm: c.atualizadoEm.toISOString(),
        }))}
        initialSegmentos={segmentos.map((s) => ({
          id: s.id,
          nome: s.nome,
          slug: s.slug,
          descricao: s.descricao,
          cor: s.cor,
          icone: s.icone,
          ativo: s.ativo,
          ordem: s.ordem,
        }))}
      />

      {/* Empresas sem segmento — visível apenas quando há órfãs */}
      {empresasSemSegmento > 0 && (
        <Card className="card-elevated border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-800">
              <Layers className="h-4 w-4" />
              Empresas sem segmento
              <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                {empresasSemSegmento}
              </span>
            </CardTitle>
            <p className="text-xs text-slate-500">
              Essas empresas não aparecem em nenhum segmento. Atribua-as ao segmento correto.
            </p>
          </CardHeader>
          <CardContent>
            <ConfigReatribuicaoSegmento
              segmentos={segmentos
                .filter((s) => s.ativo)
                .map((s) => ({ id: s.id, nome: s.nome, cor: s.cor }))}
            />
          </CardContent>
        </Card>
      )}
    </main>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
