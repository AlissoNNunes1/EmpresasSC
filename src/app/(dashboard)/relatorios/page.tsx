import { RelatorioBuilder } from "@/components/relatorios/relatorio-builder";
import { prisma } from "@/lib/prisma";
import type { DimensaoConfig, MetricaConfig } from "@/lib/validations/relatorio";
import { BarChart3 } from "lucide-react";

export default async function RelatoriosPage() {
  const [categorias, segmentos, camposVisiveis] = await Promise.all([
    prisma.categoria.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.segmento.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, cor: true },
      orderBy: { ordem: "asc" },
    }),
    prisma.campoEmpresa.findMany({
      where: { visivel: true },
      select: { id: true, label: true, tipo: true },
      orderBy: { ordem: "asc" },
    }),
  ]);

  // ── Dimensões disponíveis ────────────────────────────────────────────────────
  // Dimensões base do sistema — sempre presentes, labels fixos mas facilmente alteráveis aqui
  const dimensoesBase: DimensaoConfig[] = [
    { key: "segmento",  label: "Segmento",  tipo: "base" },
    { key: "categoria", label: "Categoria", tipo: "base" },
    { key: "bairro",    label: "Bairro",    tipo: "base" },
    { key: "porte",     label: "Porte",     tipo: "base" },
    { key: "situacao",  label: "Situação",  tipo: "base" },
  ];

  // Campos customizados do tipo SELECT → novas dimensões automáticas
  const dimensoesCampos: DimensaoConfig[] = camposVisiveis
    .filter((c) => c.tipo === "SELECT")
    .map((c) => ({
      key: `campo_${c.id}` as `campo_${number}`,
      label: c.label,
      tipo: "campo_select" as const,
    }));

  const dimensoes: DimensaoConfig[] = [...dimensoesBase, ...dimensoesCampos];

  // ── Métricas disponíveis ─────────────────────────────────────────────────────
  const metricasBase: MetricaConfig[] = [
    { key: "totalEmpresas",    label: "Nº de Empresas",       tipo: "base" },
    { key: "totalEmpregados",  label: "Total de Empregados",  tipo: "base" },
    { key: "mediaEmpregados",  label: "Média de Empregados",  tipo: "base" },
  ];

  // Campos customizados do tipo NUMERO → novas métricas automáticas
  const metricasCampos: MetricaConfig[] = camposVisiveis
    .filter((c) => c.tipo === "NUMERO")
    .map((c) => ({
      key: `camponum_${c.id}` as `camponum_${number}`,
      label: `Soma: ${c.label}`,
      tipo: "campo_numero" as const,
    }));

  const metricas: MetricaConfig[] = [...metricasBase, ...metricasCampos];

  return (
    <main className="space-y-8">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Análise</p>
            <h2 className="text-2xl font-bold text-[#1b3383]">Relatórios</h2>
            <p className="text-sm text-slate-600">
              Cruze qualquer dimensão com qualquer métrica. Campos personalizados aparecem automaticamente.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#f0f3fa] px-3 py-2 text-sm font-semibold text-[#1b3383]">
            <BarChart3 className="h-4 w-4" />
            {dimensoes.length} dimensões · {metricas.length} métricas
          </div>
        </div>
      </section>

      <RelatorioBuilder
        dimensoes={dimensoes}
        metricas={metricas}
        categorias={categorias}
        segmentos={segmentos}
      />
    </main>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
