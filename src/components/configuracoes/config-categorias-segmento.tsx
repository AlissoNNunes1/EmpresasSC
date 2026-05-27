"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/services/api";
import { atualizarCategoriaConfig, deletarCategoriaConfig, type CategoriaConfig } from "@/services/configuracoes.service";
import { Check, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";

type Props = {
  segmentoSlug: string;
  categorias: CategoriaConfig[];
  onReload: () => Promise<void>;
};

export function ConfigCategoriasSegmento({ segmentoSlug, categorias, onReload }: Props) {
  const [novoNome, setNovoNome] = useState("");
  const [novoStatus, setNovoStatus] = useState<"ATIVO" | "INATIVO">("ATIVO");
  const [criando, setCriando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  async function criar() {
    if (!novoNome.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      await apiRequest(`/api/segmentos/${segmentoSlug}/categorias`, {
        method: "POST",
        body: { nome: novoNome.trim(), status: novoStatus },
      });
      setNovoNome("");
      setNovoStatus("ATIVO");
      setCriando(false);
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao criar categoria.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao(id: number) {
    setErro(null);
    try {
      await atualizarCategoriaConfig(id, { nome: editNome.trim() });
      setEditandoId(null);
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao renomear.");
    }
  }

  async function alternarStatus(item: CategoriaConfig) {
    setErro(null);
    try {
      await atualizarCategoriaConfig(item.id, {
        status: item.status === "ATIVO" ? "INATIVO" : "ATIVO",
      });
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao atualizar status.");
    }
  }

  async function confirmarExclusao(id: number) {
    setErro(null);
    try {
      await deletarCategoriaConfig(id);
      setExcluindoId(null);
      await onReload();
    } catch (e) {
      setExcluindoId(null);
      setErro(e instanceof Error ? e.message : "Falha ao excluir.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Botão abrir formulário */}
      {!criando && (
        <Button size="sm" onClick={() => setCriando(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Nova categoria
        </Button>
      )}

      {/* Formulário de criação */}
      {criando && (
        <div className="rounded-lg border border-[#1b3383]/20 bg-[#f0f3fa] p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1b3383]">
            <Tag className="h-3.5 w-3.5" /> Nova categoria
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px]">
            <input
              autoFocus
              className="h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3383]/30"
              placeholder="Nome da categoria"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && novoNome.trim() && criar()}
            />
            <select
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm"
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value as "ATIVO" | "INATIVO")}
            >
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={criar} disabled={salvando || !novoNome.trim()}>
              {salvando ? "Criando…" : "Criar"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCriando(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {erro && (
        <p className="flex items-center gap-1.5 text-sm text-red-700">
          <X className="h-4 w-4 flex-shrink-0" /> {erro}
        </p>
      )}

      {/* Lista */}
      {categorias.length === 0 && !criando ? (
        <p className="text-sm text-slate-400">
          Nenhuma categoria específica. Clique em &quot;Nova categoria&quot; para adicionar.
        </p>
      ) : (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {categorias.map((item) => {
            const estaEditando = editandoId === item.id;
            const estaExcluindo = excluindoId === item.id;

            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  {estaEditando ? (
                    <input
                      autoFocus
                      className="h-8 w-full max-w-xs rounded-md border border-[#1b3383] px-2 text-sm ring-1 ring-[#1b3383]/30"
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editNome.trim()) salvarEdicao(item.id);
                        if (e.key === "Escape") setEditandoId(null);
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{item.nome}</span>
                      <Badge
                        className={
                          item.status === "ATIVO"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }
                      >
                        {item.status === "ATIVO" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {estaExcluindo ? (
                    <>
                      <span className="mr-1 text-xs text-red-700">Excluir?</span>
                      <button
                        onClick={() => confirmarExclusao(item.id)}
                        className="flex h-7 w-7 items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setExcluindoId(null)}
                        className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : estaEditando ? (
                    <>
                      <button
                        onClick={() => salvarEdicao(item.id)}
                        disabled={!editNome.trim()}
                        className="flex h-7 w-7 items-center justify-center rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditandoId(null)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditandoId(item.id); setEditNome(item.nome); setExcluindoId(null); }}
                        className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-500 hover:border-[#1b3383] hover:text-[#1b3383]"
                        title="Renomear"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => alternarStatus(item)}
                        className={`h-7 rounded border px-2 text-xs font-semibold transition-colors ${
                          item.status === "ATIVO"
                            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                        title={item.status === "ATIVO" ? "Desativar" : "Ativar"}
                      >
                        {item.status === "ATIVO" ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => { setEditandoId(null); setExcluindoId(item.id); }}
                        className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
