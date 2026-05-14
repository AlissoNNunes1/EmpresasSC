"use client";

import { BarChart2, BarChartHorizontal, PieChart, Table2 } from "lucide-react";

export type GroupBy = "categoria" | "porte" | "situacao" | "bairro";
export type Metrica = "totalEmpresas" | "totalEmpregados" | "mediaEmpregados";
export type VizType = "barVertical" | "barHorizontal" | "pie" | "tabela";

type Props = {
  groupBy: GroupBy;
  metrica: Metrica;
  vizType: VizType;
  filtroSituacao: string;
  filtroPorte: string;
  filtroCategoriaId: string;
  categorias: Array<{ id: number; nome: string }>;
  onChange: (patch: Partial<{
    groupBy: GroupBy;
    metrica: Metrica;
    vizType: VizType;
    filtroSituacao: string;
    filtroPorte: string;
    filtroCategoriaId: string;
  }>) => void;
};

const VIZ_OPTIONS: { key: VizType; icon: React.ReactNode; title: string }[] = [
  { key: "barVertical", icon: <BarChart2 className="h-4 w-4" />, title: "Barras verticais" },
  { key: "barHorizontal", icon: <BarChartHorizontal className="h-4 w-4" />, title: "Barras horizontais" },
  { key: "pie", icon: <PieChart className="h-4 w-4" />, title: "Pizza" },
  { key: "tabela", icon: <Table2 className="h-4 w-4" />, title: "Tabela" },
];

export function BuilderControls({ groupBy, metrica, vizType, filtroSituacao, filtroPorte, filtroCategoriaId, categorias, onChange }: Props) {
  const selectClass = "h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3383]/30";

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Agrupar por */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Agrupar por</label>
        <select className={selectClass} value={groupBy} onChange={(e) => onChange({ groupBy: e.target.value as GroupBy, filtroSituacao: "", filtroPorte: "", filtroCategoriaId: "" })}>
          <option value="categoria">Categoria</option>
          <option value="bairro">Bairro</option>
          <option value="porte">Porte</option>
          <option value="situacao">Situação</option>
        </select>
      </div>

      {/* Métrica */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Medir</label>
        <select className={selectClass} value={metrica} onChange={(e) => onChange({ metrica: e.target.value as Metrica })}>
          <option value="totalEmpresas">Nº de Empresas</option>
          <option value="totalEmpregados">Total de Empregados</option>
          <option value="mediaEmpregados">Média de Empregados</option>
        </select>
      </div>

      {/* Filtro situação */}
      <div className={`space-y-1 transition-opacity ${groupBy === "situacao" ? "pointer-events-none opacity-40" : ""}`}>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Situação</label>
        <select className={selectClass} value={filtroSituacao} onChange={(e) => onChange({ filtroSituacao: e.target.value })} disabled={groupBy === "situacao"}>
          <option value="">Todas</option>
          <option value="ATIVA">Ativa</option>
          <option value="INATIVA">Inativa</option>
          <option value="SUSPENSA">Suspensa</option>
          <option value="ENCERRADA">Encerrada</option>
        </select>
      </div>

      {/* Filtro porte */}
      <div className={`space-y-1 transition-opacity ${groupBy === "porte" ? "pointer-events-none opacity-40" : ""}`}>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Porte</label>
        <select className={selectClass} value={filtroPorte} onChange={(e) => onChange({ filtroPorte: e.target.value })} disabled={groupBy === "porte"}>
          <option value="">Todos</option>
          <option value="MEI">MEI</option>
          <option value="MICRO">Micro</option>
          <option value="PEQUENA">Pequena</option>
          <option value="MEDIA">Média</option>
          <option value="GRANDE">Grande</option>
        </select>
      </div>

      {/* Filtro categoria */}
      {categorias.length > 0 ? (
        <div className={`space-y-1 transition-opacity ${groupBy === "categoria" ? "pointer-events-none opacity-40" : ""}`}>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoria</label>
          <select className={selectClass} value={filtroCategoriaId} onChange={(e) => onChange({ filtroCategoriaId: e.target.value })} disabled={groupBy === "categoria"}>
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.nome}</option>
            ))}
          </select>
        </div>
      ) : null}

      {/* Tipo de visualização */}
      <div className="ml-auto space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Visualização</label>
        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {VIZ_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              title={opt.title}
              onClick={() => onChange({ vizType: opt.key })}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                vizType === opt.key
                  ? "bg-[#1b3383] text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-[#1b3383]"
              }`}
            >
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
