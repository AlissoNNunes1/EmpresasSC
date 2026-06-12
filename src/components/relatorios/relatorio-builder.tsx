"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/services/api";
import type { DimensaoConfig, GroupBy, Metrica, MetricaConfig, RelatorioQueryResult, RelatorioRow } from "@/lib/validations/relatorio";
import { BarChart2, Download } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BuilderControls, type VizType } from "./builder-controls";
import { VisualizacaoResultado } from "./visualizacao-resultado";

type FiltrosAtivos = {
  filtroSituacao: string;
  filtroPorte: string;
  filtroCategoriaId: string;
  filtroSegmentoId: string;
};

type BuilderState = FiltrosAtivos & {
  groupBy: GroupBy;
  metrica: Metrica;
  vizType: VizType;
};

type Status = "idle" | "loading" | "error" | "success";

type Props = {
  dimensoes: DimensaoConfig[];
  metricas: MetricaConfig[];
  categorias: Array<{ id: number; nome: string }>;
  segmentos: Array<{ id: number; nome: string; cor: string | null }>;
};

export function RelatorioBuilder({ dimensoes, metricas, categorias, segmentos }: Props) {
  const defaultGroupBy = (dimensoes[0]?.key ?? "segmento") as GroupBy;
  const defaultMetrica = (metricas[0]?.key ?? "totalEmpresas") as Metrica;

  const [state, setState] = useState<BuilderState>({
    groupBy: defaultGroupBy,
    metrica: defaultMetrica,
    vizType: "barVertical",
    filtroSituacao: "",
    filtroPorte: "",
    filtroCategoriaId: "",
    filtroSegmentoId: "",
  });

  const [status, setStatus] = useState<Status>("idle");
  const [rows, setRows] = useState<RelatorioRow[]>([]);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(async (s: BuilderState) => {
    setStatus("loading");
    setErrorMsg(null);
    const qs = new URLSearchParams({
      groupBy: s.groupBy,
      metrica: s.metrica,
      ...(s.filtroSituacao ? { situacao: s.filtroSituacao } : {}),
      ...(s.filtroPorte ? { porte: s.filtroPorte } : {}),
      ...(s.filtroCategoriaId ? { categoriaId: s.filtroCategoriaId } : {}),
      ...(s.filtroSegmentoId ? { segmentoId: s.filtroSegmentoId } : {}),
    });
    try {
      const data = await apiRequest<RelatorioQueryResult>(`/api/relatorios/query?${qs.toString()}`);
      setRows(data.rows);
      setTotal(data.total);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao carregar dados.");
      setStatus("error");
    }
  }, []);

  useEffect(() => { fetchData(state); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const exportUrls = useMemo(() => {
    const qs = new URLSearchParams({
      source: "relatorios",
      groupBy: state.groupBy,
      metrica: state.metrica,
    });

    if (state.filtroSituacao) qs.set("situacao", state.filtroSituacao);
    if (state.filtroPorte) qs.set("porte", state.filtroPorte);
    if (state.filtroCategoriaId) qs.set("categoriaId", state.filtroCategoriaId);
    if (state.filtroSegmentoId) qs.set("segmentoId", state.filtroSegmentoId);

    const query = qs.toString();

    return {
      csv: `/api/export/csv?${query}`,
      pdf: `/api/export/pdf?${query}`,
    };
  }, [state]);

  function handleChange(patch: Partial<BuilderState>) {
    const next = { ...state, ...patch };
    setState(next);
    if (!("vizType" in patch)) fetchData(next);
  }

  // Resolve os labels dinamicamente a partir das configs — nunca hardcoded
  const groupByLabel = dimensoes.find((d) => d.key === state.groupBy)?.label ?? state.groupBy;
  const metricaLabel = metricas.find((m) => m.key === state.metrica)?.label ?? state.metrica;

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart2 className="h-4 w-4 text-[#1b3383]" />
          Construtor de Relatórios
        </CardTitle>
        <p className="text-xs text-slate-500">
          Cruze qualquer dimensão com qualquer métrica. Campos personalizados criados nas configurações aparecem automaticamente aqui.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <BuilderControls
          groupBy={state.groupBy}
          metrica={state.metrica}
          vizType={state.vizType}
          filtros={{
            filtroSituacao: state.filtroSituacao,
            filtroPorte: state.filtroPorte,
            filtroCategoriaId: state.filtroCategoriaId,
            filtroSegmentoId: state.filtroSegmentoId,
          }}
          dimensoes={dimensoes}
          metricas={metricas}
          categorias={categorias}
          segmentos={segmentos}
          onChange={handleChange}
        />

        <div className="border-t border-slate-100 pt-4">
          <VisualizacaoResultado
            status={status}
            rows={rows}
            total={total}
            vizType={state.vizType}
            metricaLabel={metricaLabel}
            groupByLabel={groupByLabel}
            errorMsg={errorMsg}
          />

          {status === "success" && rows.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exportar resultado</span>
              <Link href={exportUrls.csv} className="btn-secondary h-9 px-3 text-xs">
                <Download className="h-4 w-4" />
                CSV
              </Link>
              <Link href={exportUrls.pdf} className="btn-secondary h-9 px-3 text-xs">
                <Download className="h-4 w-4" />
                PDF
              </Link>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
