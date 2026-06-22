"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/services/api";
import { AlertCircle, Download, ListFilter, Plus, Table2, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export type CampoCustomOption = {
  id: number;
  label: string;
  tipo: string;
  segmentoId: number | null;
  opcoes: string | null;
};

type CampoFiltroLinha = { id: string; campoId: number | ""; valor: string };

type Status = "idle" | "loading" | "error" | "success";

type ConsultaResult = { total: number; columns: string[]; rows: Array<Record<string, string | number | null>> };

type Props = {
  categorias: Array<{ id: number; nome: string }>;
  segmentos: Array<{ id: number; nome: string; slug: string; cor: string | null }>;
  camposCustom: CampoCustomOption[];
  builtinColumns: string[];
};

const ESTADO_FILTROS_VAZIO = {
  termo: "",
  categoriaId: "",
  segmentoSlug: "",
  bairro: "",
  porte: "",
  situacao: "",
  minEmpregados: "",
  maxEmpregados: "",
};

function parseOpcoes(opcoes: string | null): string[] {
  if (!opcoes) return [];
  try {
    const parsed = JSON.parse(opcoes);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function novaLinhaFiltro(): CampoFiltroLinha {
  return { id: Math.random().toString(36).slice(2), campoId: "", valor: "" };
}

export function ConsultaAvancada({ categorias, segmentos, camposCustom, builtinColumns }: Props) {
  const [filtros, setFiltros] = useState(ESTADO_FILTROS_VAZIO);
  const [camposFiltro, setCamposFiltro] = useState<CampoFiltroLinha[]>([]);
  const allColumns = useMemo(() => [...builtinColumns, ...camposCustom.map((c) => c.label)], [builtinColumns, camposCustom]);
  const [colunas, setColunas] = useState<Set<string>>(() => new Set(allColumns));

  const [status, setStatus] = useState<Status>("idle");
  const [resultado, setResultado] = useState<ConsultaResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function setFiltro(campo: keyof typeof ESTADO_FILTROS_VAZIO, valor: string) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function toggleColuna(label: string) {
    setColunas((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function adicionarFiltroCampo() {
    setCamposFiltro((prev) => [...prev, novaLinhaFiltro()]);
  }

  function removerFiltroCampo(id: string) {
    setCamposFiltro((prev) => prev.filter((l) => l.id !== id));
  }

  function atualizarFiltroCampo(id: string, patch: Partial<CampoFiltroLinha>) {
    setCamposFiltro((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  const queryString = useCallback(() => {
    const qs = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== "") qs.set(key, value);
    });
    if (colunas.size > 0 && colunas.size < allColumns.length) {
      qs.set("columns", Array.from(colunas).join(","));
    }
    camposFiltro
      .filter((l) => l.campoId !== "" && l.valor.trim() !== "")
      .forEach((l) => qs.append("cf", `${l.campoId}:${l.valor.trim()}`));
    return qs;
  }, [filtros, colunas, allColumns.length, camposFiltro]);

  const handleConsultar = useCallback(async () => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const data = await apiRequest<ConsultaResult>(`/api/empresas/consulta?${queryString().toString()}`);
      setResultado(data);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao consultar empresas.");
      setStatus("error");
    }
  }, [queryString]);

  const exportUrls = useMemo(() => {
    const qs = queryString();
    return {
      csv: `/api/export/csv?${qs.toString()}`,
      xlsx: `/api/export/xlsx?${qs.toString()}`,
      pdf: `/api/export/pdf?${qs.toString()}`,
    };
  }, [queryString]);

  const sc = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900";
  const label = "text-xs font-semibold uppercase tracking-wide text-slate-600";

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1b3383]">
          <ListFilter className="h-4 w-4" />
          Filtros
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <label className={label}>Busca textual</label>
            <input
              className={sc}
              value={filtros.termo}
              onChange={(e) => setFiltro("termo", e.target.value)}
              placeholder="Razão social, fantasia ou CNPJ"
            />
          </div>

          {segmentos.length > 0 && (
            <div className="space-y-1">
              <label className={label}>Segmento</label>
              <select className={sc} value={filtros.segmentoSlug} onChange={(e) => setFiltro("segmentoSlug", e.target.value)}>
                <option value="">Todos</option>
                {segmentos.map((s) => (
                  <option key={s.id} value={s.slug}>{s.nome}</option>
                ))}
              </select>
            </div>
          )}

          {categorias.length > 0 && (
            <div className="space-y-1">
              <label className={label}>Categoria</label>
              <select className={sc} value={filtros.categoriaId} onChange={(e) => setFiltro("categoriaId", e.target.value)}>
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className={label}>Bairro</label>
            <input className={sc} value={filtros.bairro} onChange={(e) => setFiltro("bairro", e.target.value)} placeholder="Bairro" />
          </div>

          <div className="space-y-1">
            <label className={label}>Porte</label>
            <select className={sc} value={filtros.porte} onChange={(e) => setFiltro("porte", e.target.value)}>
              <option value="">Todos</option>
              <option value="MEI">MEI</option>
              <option value="MICRO">Micro</option>
              <option value="PEQUENA">Pequena</option>
              <option value="MEDIA">Média</option>
              <option value="GRANDE">Grande</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className={label}>Situação</label>
            <select className={sc} value={filtros.situacao} onChange={(e) => setFiltro("situacao", e.target.value)}>
              <option value="">Todas</option>
              <option value="ATIVA">Ativa</option>
              <option value="INATIVA">Inativa</option>
              <option value="SUSPENSA">Suspensa</option>
              <option value="ENCERRADA">Encerrada</option>
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <label className={label}>Nº de empregados</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                className={sc}
                value={filtros.minEmpregados}
                onChange={(e) => setFiltro("minEmpregados", e.target.value)}
                placeholder="Mín. (ex: 5 = mais de 4)"
              />
              <span className="flex-shrink-0 text-xs font-medium text-slate-400">até</span>
              <input
                type="number"
                min={0}
                className={sc}
                value={filtros.maxEmpregados}
                onChange={(e) => setFiltro("maxEmpregados", e.target.value)}
                placeholder="Máx."
              />
            </div>
          </div>
        </div>

        {camposCustom.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between">
              <span className={label}>Filtros por campos personalizados</span>
              <button
                type="button"
                onClick={adicionarFiltroCampo}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1b3383] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar filtro
              </button>
            </div>
            {camposFiltro.map((linha) => {
              const campo = camposCustom.find((c) => c.id === linha.campoId);
              const opcoes = campo ? parseOpcoes(campo.opcoes) : [];
              return (
                <div key={linha.id} className="flex flex-wrap items-center gap-2">
                  <select
                    className={`${sc} max-w-[220px]`}
                    value={linha.campoId}
                    onChange={(e) => atualizarFiltroCampo(linha.id, { campoId: e.target.value ? Number(e.target.value) : "", valor: "" })}
                  >
                    <option value="">Selecione o campo…</option>
                    {camposCustom.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>

                  {opcoes.length > 0 ? (
                    <select
                      className={`${sc} max-w-[220px]`}
                      value={linha.valor}
                      onChange={(e) => atualizarFiltroCampo(linha.id, { valor: e.target.value })}
                    >
                      <option value="">Selecione o valor…</option>
                      {opcoes.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={`${sc} max-w-[220px]`}
                      value={linha.valor}
                      onChange={(e) => atualizarFiltroCampo(linha.id, { valor: e.target.value })}
                      placeholder="Valor contém…"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => removerFiltroCampo(linha.id)}
                    className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Remover filtro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1b3383]">
          <Table2 className="h-4 w-4" />
          Colunas a exibir/exportar
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {allColumns.map((col) => (
            <label key={col} className="flex items-center gap-1.5 text-sm text-slate-700">
              <input type="checkbox" checked={colunas.has(col)} onChange={() => toggleColuna(col)} className="h-3.5 w-3.5 rounded border-slate-300" />
              {col}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={handleConsultar} disabled={status === "loading"} className="btn-cta h-10 px-5 disabled:opacity-70">
          {status === "loading" ? "Consultando…" : "Consultar"}
        </button>

        {resultado && resultado.rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exportar resultado</span>
            <a href={exportUrls.csv} className="btn-secondary h-9 px-3 text-xs">
              <Download className="h-4 w-4" />
              CSV
            </a>
            <a href={exportUrls.xlsx} className="btn-secondary h-9 px-3 text-xs">
              <Download className="h-4 w-4" />
              XLSX
            </a>
            <a href={exportUrls.pdf} className="btn-secondary h-9 px-3 text-xs">
              <Download className="h-4 w-4" />
              PDF
            </a>
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="flex h-12 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {errorMsg ?? "Não foi possível consultar as empresas."}
        </div>
      )}

      {status === "success" && resultado && (
        <div className="space-y-2">
          <span className="text-sm text-slate-500">
            {resultado.total} empresa{resultado.total !== 1 ? "s" : ""} encontrada{resultado.total !== 1 ? "s" : ""}
            {resultado.total > resultado.rows.length ? ` (exibindo as primeiras ${resultado.rows.length} — exporte para ver todas)` : ""}
          </span>

          {resultado.rows.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
              <Table2 className="h-8 w-8 text-slate-300" />
              Nenhuma empresa encontrada para estes filtros.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    {resultado.columns.map((col) => (
                      <TableHead key={col} className="whitespace-nowrap">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:nth-child(even)]:bg-slate-50/50">
                  {resultado.rows.map((row, i) => (
                    <TableRow key={i}>
                      {resultado.columns.map((col) => (
                        <TableCell key={col} className="whitespace-nowrap text-slate-700">{row[col] ?? ""}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
