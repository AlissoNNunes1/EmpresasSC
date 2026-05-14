"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/services/api";
import type { RelatorioQueryResult, RelatorioRow } from "@/lib/validations/relatorio";
import { BarChart2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BuilderControls, type GroupBy, type Metrica, type VizType } from "./builder-controls";
import { VisualizacaoResultado } from "./visualizacao-resultado";

type BuilderState = {
  groupBy: GroupBy;
  metrica: Metrica;
  vizType: VizType;
  filtroSituacao: string;
  filtroPorte: string;
  filtroCategoriaId: string;
};

type Status = "idle" | "loading" | "error" | "success";

type Props = {
  categorias: Array<{ id: number; nome: string }>;
};

export function RelatorioBuilder({ categorias }: Props) {
  const [state, setState] = useState<BuilderState>({
    groupBy: "categoria",
    metrica: "totalEmpresas",
    vizType: "barVertical",
    filtroSituacao: "",
    filtroPorte: "",
    filtroCategoriaId: "",
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

  // Fetch on mount with initial state
  useEffect(() => {
    fetchData(state);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(patch: Partial<BuilderState>) {
    const next = { ...state, ...patch };
    setState(next);

    // vizType changes are presentation-only — no refetch needed
    if (!("vizType" in patch)) {
      fetchData(next);
    }
  }

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart2 className="h-4 w-4 text-[#1b3383]" />
          Construtor de Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <BuilderControls
          groupBy={state.groupBy}
          metrica={state.metrica}
          vizType={state.vizType}
          filtroSituacao={state.filtroSituacao}
          filtroPorte={state.filtroPorte}
          filtroCategoriaId={state.filtroCategoriaId}
          categorias={categorias}
          onChange={handleChange}
        />

        <div className="border-t border-slate-100 pt-4">
          <VisualizacaoResultado
            status={status}
            rows={rows}
            total={total}
            vizType={state.vizType}
            metrica={state.metrica}
            groupBy={state.groupBy}
            errorMsg={errorMsg}
          />
        </div>
      </CardContent>
    </Card>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
