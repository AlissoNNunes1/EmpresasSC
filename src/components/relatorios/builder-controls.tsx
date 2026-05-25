"use client";

import type { DimensaoConfig, GroupBy, Metrica, MetricaConfig } from "@/lib/validations/relatorio";
import { BarChart2, BarChartHorizontal, PieChart, Table2 } from "lucide-react";

export type { GroupBy, Metrica };
export type VizType = "barVertical" | "barHorizontal" | "pie" | "tabela";

type FiltrosAtivos = {
  filtroSituacao: string;
  filtroPorte: string;
  filtroCategoriaId: string;
  filtroSegmentoId: string;
};

type Props = {
  groupBy: GroupBy;
  metrica: Metrica;
  vizType: VizType;
  filtros: FiltrosAtivos;
  dimensoes: DimensaoConfig[];       // vêm do banco — totalmente dinâmicas
  metricas: MetricaConfig[];         // vêm do banco — totalmente dinâmicas
  categorias: Array<{ id: number; nome: string }>;
  segmentos: Array<{ id: number; nome: string; cor: string | null }>;
  onChange: (patch: Partial<FiltrosAtivos & {
    groupBy: GroupBy;
    metrica: Metrica;
    vizType: VizType;
  }>) => void;
};

const VIZ_OPTIONS: { key: VizType; icon: React.ReactNode; title: string }[] = [
  { key: "barVertical",   icon: <BarChart2 className="h-4 w-4" />,          title: "Barras verticais"   },
  { key: "barHorizontal", icon: <BarChartHorizontal className="h-4 w-4" />, title: "Barras horizontais" },
  { key: "pie",           icon: <PieChart className="h-4 w-4" />,            title: "Pizza"              },
  { key: "tabela",        icon: <Table2 className="h-4 w-4" />,              title: "Tabela"             },
];

export function BuilderControls({ groupBy, metrica, vizType, filtros, dimensoes, metricas, categorias, segmentos, onChange }: Props) {
  const sc = "h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3383]/30";
  const dim = (blocked: boolean) => `space-y-1 transition-opacity ${blocked ? "pointer-events-none opacity-40" : ""}`;

  // Agrupa dimensões por tipo para o <optgroup>
  const dimsBase = dimensoes.filter((d) => d.tipo === "base");
  const dimsCampo = dimensoes.filter((d) => d.tipo === "campo_select");

  function handleGroupByChange(value: string) {
    onChange({ groupBy: value as GroupBy, filtroSituacao: "", filtroPorte: "", filtroCategoriaId: "", filtroSegmentoId: "" });
  }

  return (
    <div className="flex flex-wrap items-end gap-4">

      {/* Agrupar por — dinâmico */}
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agrupar por</label>
        <select className={sc} value={groupBy} onChange={(e) => handleGroupByChange(e.target.value)}>
          <optgroup label="Dados do sistema">
            {dimsBase.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </optgroup>
          {dimsCampo.length > 0 && (
            <optgroup label="Campos personalizados">
              {dimsCampo.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </optgroup>
          )}
        </select>
      </div>

      {/* Medir — dinâmico */}
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Medir</label>
        <select className={sc} value={metrica} onChange={(e) => onChange({ metrica: e.target.value as Metrica })}>
          {metricas.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </div>

      {/* Filtro: Segmento */}
      {segmentos.length > 0 && (
        <div className={dim(groupBy === "segmento")}>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Segmento</label>
          <select className={sc} value={filtros.filtroSegmentoId} onChange={(e) => onChange({ filtroSegmentoId: e.target.value })} disabled={groupBy === "segmento"}>
            <option value="">Todos</option>
            {segmentos.map((s) => <option key={s.id} value={String(s.id)}>{s.nome}</option>)}
          </select>
        </div>
      )}

      {/* Filtro: Situação */}
      <div className={dim(groupBy === "situacao")}>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Situação</label>
        <select className={sc} value={filtros.filtroSituacao} onChange={(e) => onChange({ filtroSituacao: e.target.value })} disabled={groupBy === "situacao"}>
          <option value="">Todas</option>
          <option value="ATIVA">Ativa</option>
          <option value="INATIVA">Inativa</option>
          <option value="SUSPENSA">Suspensa</option>
          <option value="ENCERRADA">Encerrada</option>
        </select>
      </div>

      {/* Filtro: Porte */}
      <div className={dim(groupBy === "porte")}>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Porte</label>
        <select className={sc} value={filtros.filtroPorte} onChange={(e) => onChange({ filtroPorte: e.target.value })} disabled={groupBy === "porte"}>
          <option value="">Todos</option>
          <option value="MEI">MEI</option>
          <option value="MICRO">Micro</option>
          <option value="PEQUENA">Pequena</option>
          <option value="MEDIA">Média</option>
          <option value="GRANDE">Grande</option>
        </select>
      </div>

      {/* Filtro: Categoria */}
      {categorias.length > 0 && (
        <div className={dim(groupBy === "categoria")}>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Categoria</label>
          <select className={sc} value={filtros.filtroCategoriaId} onChange={(e) => onChange({ filtroCategoriaId: e.target.value })} disabled={groupBy === "categoria"}>
            <option value="">Todas</option>
            {categorias.map((c) => <option key={c.id} value={String(c.id)}>{c.nome}</option>)}
          </select>
        </div>
      )}

      {/* Tipo de visualização */}
      <div className="ml-auto space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visualização</label>
        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {VIZ_OPTIONS.map((opt) => (
            <button key={opt.key} type="button" title={opt.title} onClick={() => onChange({ vizType: opt.key })}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${vizType === opt.key ? "bg-[#1b3383] text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-[#1b3383]"}`}>
              {opt.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
