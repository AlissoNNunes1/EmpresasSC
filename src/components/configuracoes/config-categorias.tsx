"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  atualizarCategoriaConfig,
  criarCategoriaConfig,
  deletarCategoriaConfig,
  type CategoriaConfig,
} from "@/services/configuracoes.service";
import { Check, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";

type Props = {
  categorias: CategoriaConfig[];
  onReload: () => Promise<void>;
  loading: boolean;
};

export function ConfigCategorias({ categorias, onReload, loading }: Props) {
  const [novoNome, setNovoNome] = useState("");
  const [novoStatus, setNovoStatus] = useState<"ATIVO" | "INATIVO">("ATIVO");
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");

  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  async function criar() {
    setErro(null);
    setCriando(true);
    try {
      await criarCategoriaConfig({ nome: novoNome.trim(), status: novoStatus });
      setNovoNome("");
      setNovoStatus("ATIVO");
      await onReload();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao criar categoria.");
    } finally {
      setCriando(false);
    }
  }

  async function salvarEdicao(id: number) {
    setErro(null);
    try {
      await atualizarCategoriaConfig(id, { nome: editNome.trim() });
      setEditandoId(null);
      await onReload();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao renomear categoria.");
    }
  }

  async function alternarStatus(item: CategoriaConfig) {
    setErro(null);
    try {
      await atualizarCategoriaConfig(item.id, {
        status: item.status === "ATIVO" ? "INATIVO" : "ATIVO",
      });
      await onReload();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao atualizar categoria.");
    }
  }

  async function confirmarExclusao(id: number) {
    setErro(null);
    try {
      await deletarCategoriaConfig(id);
      setExcluindoId(null);
      await onReload();
    } catch (error) {
      setExcluindoId(null);
      setErro(error instanceof Error ? error.message : "Falha ao excluir categoria.");
    }
  }

  function iniciarEdicao(item: CategoriaConfig) {
    setExcluindoId(null);
    setEditandoId(item.id);
    setEditNome(item.nome);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditNome("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Tag className="h-4 w-4 text-[#1b3383]" />
          Nova categoria
        </h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px_auto]">
          <input
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            placeholder="Nome da categoria"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && novoNome.trim() && criar()}
          />
          <select
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            value={novoStatus}
            onChange={(e) => setNovoStatus(e.target.value as "ATIVO" | "INATIVO")}
          >
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <Button
            type="button"
            onClick={criar}
            disabled={loading || criando || !novoNome.trim()}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {criando ? "Criando…" : "Criar"}
          </Button>
        </div>
      </div>

      {erro ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-red-700">
          <X className="h-4 w-4 flex-shrink-0" />
          {erro}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700">Nome</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700">Status</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-center text-slate-500" colSpan={3}>
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            ) : (
              categorias.map((item) => {
                const estaEditando = editandoId === item.id;
                const estaExcluindo = excluindoId === item.id;

                return (
                  <tr key={item.id} className="border-t border-slate-200 transition-colors hover:bg-slate-50">
                    <td className="px-3 py-2">
                      {estaEditando ? (
                        <input
                          autoFocus
                          className="h-8 w-full max-w-xs rounded-lg border border-[#1b3383] px-2 text-sm ring-1 ring-[#1b3383]/30"
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && editNome.trim()) salvarEdicao(item.id);
                            if (e.key === "Escape") cancelarEdicao();
                          }}
                        />
                      ) : (
                        <span className="font-medium text-slate-800">{item.nome}</span>
                      )}
                    </td>

                    <td className="px-3 py-2">
                      {!estaEditando && (
                        <Badge
                          className={
                            item.status === "ATIVO"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }
                        >
                          {item.status === "ATIVO" ? "Ativo" : "Inativo"}
                        </Badge>
                      )}
                    </td>

                    <td className="px-3 py-2">
                      {estaExcluindo ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-red-700">Excluir &quot;{item.nome}&quot;?</span>
                          <button
                            type="button"
                            onClick={() => confirmarExclusao(item.id)}
                            className="flex h-7 items-center gap-1 rounded-md bg-red-600 px-2 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            <Check className="h-3 w-3" />
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setExcluindoId(null)}
                            className="flex h-7 items-center gap-1 rounded-md border border-slate-300 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <X className="h-3 w-3" />
                            Cancelar
                          </button>
                        </div>
                      ) : estaEditando ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => salvarEdicao(item.id)}
                            disabled={!editNome.trim()}
                            title="Salvar"
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelarEdicao}
                            title="Cancelar"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(item)}
                            disabled={loading}
                            title="Renomear"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-[#1b3383] hover:text-[#1b3383] disabled:opacity-40"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => alternarStatus(item)}
                            disabled={loading}
                            title={item.status === "ATIVO" ? "Desativar" : "Ativar"}
                            className={`h-7 rounded-md border px-2 text-xs font-semibold transition-colors disabled:opacity-40 ${
                              item.status === "ATIVO"
                                ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {item.status === "ATIVO" ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditandoId(null); setExcluindoId(item.id); }}
                            disabled={loading}
                            title="Excluir categoria"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
