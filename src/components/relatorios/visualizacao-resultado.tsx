"use client";

import { RelatorioBarHorizontal } from "@/components/charts/relatorio-bar-horizontal";
import { RelatorioBarVertical } from "@/components/charts/relatorio-bar-vertical";
import { RelatorioPie } from "@/components/charts/relatorio-pie";
import { RelatorioTable } from "@/components/relatorios/relatorio-table";
import type { RelatorioRow } from "@/lib/validations/relatorio";
import type { VizType } from "@/components/relatorios/builder-controls";
import { AlertCircle, BarChart2 } from "lucide-react";

type Props = {
  status: "idle" | "loading" | "error" | "success";
  rows: RelatorioRow[];
  total: number;
  vizType: VizType;
  // Labels resolvidos pelo builder a partir das configs do banco — sem hardcode aqui
  metricaLabel: string;
  groupByLabel: string;
  errorMsg: string | null;
};

export function VisualizacaoResultado({ status, rows, total, vizType, metricaLabel, groupByLabel, errorMsg }: Props) {
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
      <span className="text-sm text-slate-500">
        {rows.length} {groupByLabel.toLowerCase()}{rows.length !== 1 ? "s" : ""} ·{" "}
        <span className="font-semibold text-slate-700">
          {Number.isInteger(total) ? total : total.toFixed(1)} {metricaLabel.toLowerCase()} no total
        </span>
      </span>

      {vizType === "barVertical"   && <RelatorioBarVertical rows={rows} metricaLabel={metricaLabel} />}
      {vizType === "barHorizontal" && <RelatorioBarHorizontal rows={rows} metricaLabel={metricaLabel} />}
      {vizType === "pie"           && <RelatorioPie rows={rows} metricaLabel={metricaLabel} total={total} />}
      {vizType === "tabela"        && <RelatorioTable rows={rows} metricaLabel={metricaLabel} groupByLabel={groupByLabel} total={total} />}
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
