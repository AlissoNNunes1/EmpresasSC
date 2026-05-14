"use client";

import { RelatorioBarHorizontal } from "@/components/charts/relatorio-bar-horizontal";
import { RelatorioBarVertical } from "@/components/charts/relatorio-bar-vertical";
import { RelatorioPie } from "@/components/charts/relatorio-pie";
import { RelatorioTable } from "@/components/relatorios/relatorio-table";
import type { GroupBy, Metrica, VizType } from "@/components/relatorios/builder-controls";
import type { RelatorioRow } from "@/lib/validations/relatorio";
import { AlertCircle, BarChart2 } from "lucide-react";

const METRICA_LABELS: Record<Metrica, string> = {
  totalEmpresas: "Empresas",
  totalEmpregados: "Empregados",
  mediaEmpregados: "Média de Empregados",
};

const GROUPBY_LABELS: Record<GroupBy, string> = {
  categoria: "Categoria",
  bairro: "Bairro",
  porte: "Porte",
  situacao: "Situação",
};

type Props = {
  status: "idle" | "loading" | "error" | "success";
  rows: RelatorioRow[];
  total: number;
  vizType: VizType;
  metrica: Metrica;
  groupBy: GroupBy;
  errorMsg: string | null;
};

export function VisualizacaoResultado({ status, rows, total, vizType, metrica, groupBy, errorMsg }: Props) {
  const metricaLabel = METRICA_LABELS[metrica];
  const groupByLabel = GROUPBY_LABELS[groupBy];

  if (status === "idle") return null;

  if (status === "loading") {
    return <div className="h-80 w-full animate-pulse rounded-lg bg-slate-100" />;
  }

  if (status === "error") {
    return (
      <div className="flex h-40 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        {errorMsg ?? "Não foi possível carregar os dados."}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        <BarChart2 className="h-8 w-8 text-slate-300" />
        Nenhum dado encontrado para esta combinação de filtros.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">
          {rows.length} {groupByLabel.toLowerCase()}{rows.length !== 1 ? "s" : ""} ·{" "}
          <span className="font-semibold text-slate-700">
            {Number.isInteger(total) ? total : total.toFixed(1)} {metricaLabel.toLowerCase()} no total
          </span>
        </span>
      </div>

      {vizType === "barVertical" && <RelatorioBarVertical rows={rows} metricaLabel={metricaLabel} />}
      {vizType === "barHorizontal" && <RelatorioBarHorizontal rows={rows} metricaLabel={metricaLabel} />}
      {vizType === "pie" && <RelatorioPie rows={rows} metricaLabel={metricaLabel} total={total} />}
      {vizType === "tabela" && <RelatorioTable rows={rows} metricaLabel={metricaLabel} groupByLabel={groupByLabel} total={total} />}
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
