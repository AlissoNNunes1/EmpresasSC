"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DimensaoConfig, MetricaConfig } from "@/lib/validations/relatorio";
import { BarChart2, ListFilter } from "lucide-react";
import { useState } from "react";
import { ConsultaAvancada, type CampoCustomOption } from "./consulta-avancada";
import { RelatorioBuilder } from "./relatorio-builder";

type Tab = "visao-geral" | "consulta";

type Props = {
  dimensoes: DimensaoConfig[];
  metricas: MetricaConfig[];
  categorias: Array<{ id: number; nome: string }>;
  segmentos: Array<{ id: number; nome: string; slug: string; cor: string | null }>;
  camposCustom: CampoCustomOption[];
  builtinColumns: string[];
};

export function RelatoriosTabs({ dimensoes, metricas, categorias, segmentos, camposCustom, builtinColumns }: Props) {
  const [tab, setTab] = useState<Tab>("visao-geral");

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
      active ? "bg-[#1b3383] text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-[#1b3383]"
    }`;

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {tab === "visao-geral" ? <BarChart2 className="h-4 w-4 text-[#1b3383]" /> : <ListFilter className="h-4 w-4 text-[#1b3383]" />}
            {tab === "visao-geral" ? "Construtor de Relatórios" : "Consulta Avançada de Empresas"}
          </CardTitle>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button type="button" className={tabClass(tab === "visao-geral")} onClick={() => setTab("visao-geral")}>
              <BarChart2 className="h-4 w-4" />
              Visão geral
            </button>
            <button type="button" className={tabClass(tab === "consulta")} onClick={() => setTab("consulta")}>
              <ListFilter className="h-4 w-4" />
              Consulta avançada
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {tab === "visao-geral"
            ? "Cruze qualquer dimensão com qualquer métrica. Campos personalizados criados nas configurações aparecem automaticamente aqui."
            : "Monte sua própria lista: escolha filtros (ex.: mais de 4 empregados) e as colunas que quer ver, depois exporte em CSV, XLSX ou PDF."}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {tab === "visao-geral" ? (
          <RelatorioBuilder dimensoes={dimensoes} metricas={metricas} categorias={categorias} segmentos={segmentos} />
        ) : (
          <ConsultaAvancada categorias={categorias} segmentos={segmentos} camposCustom={camposCustom} builtinColumns={builtinColumns} />
        )}
      </CardContent>
    </Card>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
