"use client";

import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type EmpresaOrfa = {
  id: number;
  razaoSocial: string;
  cnpj: string;
  porte: string;
  situacao: string;
};

type Segmento = { id: number; nome: string; cor: string | null };

type Props = {
  segmentos: Segmento[];
};

function formatCnpj(cnpj: string) {
  if (cnpj.length === 14)
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return cnpj;
}

export function ConfigReatribuicaoSegmento({ segmentos }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [empresas, setEmpresas] = useState<EmpresaOrfa[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [segmentoId, setSegmentoId] = useState<number>(segmentos[0]?.id ?? 0);
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());
  const [todos, setTodos] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/admin/empresas-sem-segmento");
      if (res.ok) setEmpresas(await res.json());
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function toggleSelecionada(id: number) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodos(checked: boolean) {
    setTodos(checked);
    if (checked) setSelecionadas(new Set());
  }

  async function atribuir() {
    if (!segmentoId) return;
    setSaving(true);
    setMensagem(null);
    setErro(null);

    startTransition(async () => {
      try {
        const body: { segmentoId: number; empresaIds?: number[] } = { segmentoId };
        if (!todos && selecionadas.size > 0) body.empresaIds = [...selecionadas];

        const res = await fetch("/api/admin/empresas-sem-segmento", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json() as { atualizadas?: number; error?: string };
        if (!res.ok || data.error) {
          setErro(data.error ?? "Erro ao atribuir segmento.");
        } else {
          setMensagem(`${data.atualizadas} empresa${data.atualizadas !== 1 ? "s" : ""} atribuída${data.atualizadas !== 1 ? "s" : ""} com sucesso.`);
          setSelecionadas(new Set());
          setTodos(true);
          await carregar();
          router.refresh();
        }
      } catch {
        setErro("Não foi possível concluir a operação.");
      } finally {
        setSaving(false);
      }
    });
  }

  const totalSelecionadas = todos ? empresas.length : selecionadas.size;

  if (!loadingList && empresas.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        Todas as empresas já estão atribuídas a um segmento.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {/* Cabeçalho de status */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
        <div className="text-sm text-amber-800">
          {loadingList
            ? "Carregando…"
            : <><strong>{empresas.length}</strong> empresa{empresas.length !== 1 ? "s" : ""} sem segmento atribuído.</>}
        </div>
        <button
          type="button"
          onClick={carregar}
          className="ml-auto text-amber-600 hover:text-amber-800"
          title="Recarregar"
          disabled={loadingList}
        >
          <RefreshCw className={`h-4 w-4 ${loadingList ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Controles de atribuição */}
      {!loadingList && empresas.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={segmentoId}
              onChange={(e) => setSegmentoId(Number(e.target.value))}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              disabled={saving}
            >
              {segmentos.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>

            <button
              type="button"
              className="btn-cta"
              onClick={atribuir}
              disabled={saving || (todos ? empresas.length === 0 : selecionadas.size === 0)}
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Atribuindo…</>
                : <>Atribuir {totalSelecionadas > 0 ? `${totalSelecionadas} ` : ""}ao segmento</>}
            </button>
          </div>

          {/* Feedback */}
          {mensagem && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> {mensagem}
            </p>
          )}
          {erro && (
            <p className="text-sm text-red-600">{erro}</p>
          )}

          {/* Lista de empresas com seleção */}
          <div className="rounded-lg border border-slate-200 bg-white">
            {/* Header com "todos" */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-2">
              <input
                type="checkbox"
                id="chk-todas"
                checked={todos}
                onChange={(e) => toggleTodos(e.target.checked)}
                className="h-4 w-4 rounded border-slate-400 accent-[#1b3383]"
              />
              <label htmlFor="chk-todas" className="text-xs font-semibold text-slate-500 cursor-pointer">
                Selecionar todas ({empresas.length})
              </label>
            </div>

            <ul className="max-h-72 overflow-y-auto divide-y divide-slate-50">
              {empresas.map((e) => {
                const checked = todos || selecionadas.has(e.id);
                return (
                  <li key={e.id} className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${checked ? "bg-blue-50/40" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (todos) {
                          // Sair do modo "todos" e selecionar todas menos esta
                          const novo = new Set(empresas.map((x) => x.id));
                          novo.delete(e.id);
                          setSelecionadas(novo);
                          setTodos(false);
                        } else {
                          toggleSelecionada(e.id);
                        }
                      }}
                      className="h-4 w-4 flex-shrink-0 rounded border-slate-400 accent-[#1b3383]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">{e.razaoSocial}</p>
                      <p className="text-xs text-slate-400">{formatCnpj(e.cnpj)} · {e.porte} · {e.situacao}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="text-xs text-slate-400">
            Após a atribuição a lista de cada segmento refletirá as empresas corretamente.
          </p>
        </>
      )}
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
