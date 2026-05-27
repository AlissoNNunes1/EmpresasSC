"use client";

import { CampoOpcoesEditor } from "@/components/configuracoes/campo-opcoes-editor";
import { Button } from "@/components/ui/button";
import {
  atualizarCampo,
  excluirCampo,
  parseCampoOpcoes,
  type CampoEmpresaConfig,
} from "@/services/campos.service";
import { apiRequest } from "@/services/api";
import { Check, ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

type Props = {
  segmentoSlug: string;
  campos: CampoEmpresaConfig[];
  onReload: () => Promise<void>;
};

const TIPO_LABELS: Record<CampoEmpresaConfig["tipo"], string> = {
  TEXTO: "Texto",
  NUMERO: "Número",
  SELECT: "Seleção",
  TEXTAREA: "Texto longo",
  DATA: "Data",
};

export function ConfigCamposSegmento({ segmentoSlug, campos, onReload }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [novoLabel, setNovoLabel] = useState("");
  const [novoTipo, setNovoTipo] = useState<CampoEmpresaConfig["tipo"]>("TEXTO");
  const [novoObrig, setNovoObrig] = useState(false);
  const [novasOpcoes, setNovasOpcoes] = useState<string[]>([]);
  const [criando, setCriando] = useState(false);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editObrig, setEditObrig] = useState(false);
  const [editOpcoes, setEditOpcoes] = useState<string[]>([]);

  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  async function criar() {
    if (!novoLabel.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      await apiRequest(`/api/segmentos/${segmentoSlug}/campos`, {
        method: "POST",
        body: {
          label: novoLabel.trim(),
          tipo: novoTipo,
          obrigatorio: novoObrig,
          opcoes: novoTipo === "SELECT" ? novasOpcoes : undefined,
        },
      });
      setNovoLabel("");
      setNovoTipo("TEXTO");
      setNovoObrig(false);
      setNovasOpcoes([]);
      setCriando(false);
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar campo.");
    } finally {
      setSalvando(false);
    }
  }

  function iniciarEdicao(campo: CampoEmpresaConfig) {
    setEditandoId(campo.id);
    setEditLabel(campo.label);
    setEditObrig(campo.obrigatorio);
    setEditOpcoes(parseCampoOpcoes(campo.opcoes));
    setExcluindoId(null);
  }

  async function salvarEdicao(campo: CampoEmpresaConfig) {
    setSalvando(true);
    setErro(null);
    try {
      await atualizarCampo(campo.id, {
        label: editLabel.trim(),
        obrigatorio: editObrig,
        opcoes: campo.tipo === "SELECT" ? editOpcoes : null,
      });
      setEditandoId(null);
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar campo.");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao(id: number) {
    setSalvando(true);
    setErro(null);
    try {
      await excluirCampo(id);
      setExcluindoId(null);
      await onReload();
    } catch (e) {
      setExcluindoId(null);
      setErro(e instanceof Error ? e.message : "Erro ao excluir campo.");
    } finally {
      setSalvando(false);
    }
  }

  async function moverOrdem(index: number, dir: -1 | 1) {
    const alvo = index + dir;
    if (alvo < 0 || alvo >= campos.length) return;
    setSalvando(true);
    try {
      const ids = campos.map((c) => c.id);
      [ids[index], ids[alvo]] = [ids[alvo], ids[index]];
      await apiRequest("/api/admin/campos/0", { method: "PUT", body: { ids } });
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao reordenar.");
    } finally {
      setSalvando(false);
    }
  }

  const inputCls =
    "h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3383]/30";

  return (
    <div className="space-y-4">
      {/* Botão abrir formulário */}
      {!criando && (
        <Button size="sm" onClick={() => setCriando(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Novo campo
        </Button>
      )}

      {/* Formulário de criação */}
      {criando && (
        <div className="rounded-lg border border-[#1b3383]/20 bg-[#f0f3fa] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1b3383]">
            Novo campo personalizado
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-600">Label exibida *</label>
              <input
                className={inputCls}
                value={novoLabel}
                onChange={(e) => setNovoLabel(e.target.value)}
                placeholder="Ex: WhatsApp, Licença Ambiental"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Tipo</label>
              <select
                className={inputCls + " bg-white"}
                value={novoTipo}
                onChange={(e) => setNovoTipo(e.target.value as CampoEmpresaConfig["tipo"])}
              >
                {Object.entries(TIPO_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          {novoTipo === "SELECT" && (
            <div className="mt-3">
              <CampoOpcoesEditor values={novasOpcoes} onChange={setNovasOpcoes} label="Opções disponíveis" />
            </div>
          )}
          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm text-slate-700">
              <input type="checkbox" checked={novoObrig} onChange={(e) => setNovoObrig(e.target.checked)} />
              Obrigatório
            </label>
            <Button size="sm" onClick={criar} disabled={salvando || !novoLabel.trim()}>
              {salvando ? "Salvando…" : "Criar campo"}
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
      {campos.length === 0 && !criando ? (
        <p className="text-sm text-slate-400">
          Nenhum campo personalizado para este segmento. Clique em &quot;Novo campo&quot; para adicionar.
        </p>
      ) : (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {campos.map((campo, idx) => {
            const estaEditando = editandoId === campo.id;
            const estaExcluindo = excluindoId === campo.id;

            return (
              <div key={campo.id} className="flex items-start gap-3 px-4 py-3">
                {/* Reordenar */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => moverOrdem(idx, -1)}
                    disabled={salvando || idx === 0}
                    className="text-slate-300 hover:text-slate-600 disabled:opacity-20"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moverOrdem(idx, 1)}
                    disabled={salvando || idx === campos.length - 1}
                    className="text-slate-300 hover:text-slate-600 disabled:opacity-20"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  {estaEditando ? (
                    <div className="space-y-2">
                      <input
                        autoFocus
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") salvarEdicao(campo);
                          if (e.key === "Escape") setEditandoId(null);
                        }}
                        className="h-8 w-full rounded-md border border-[#1b3383] px-2 text-sm ring-1 ring-[#1b3383]/30"
                      />
                      {campo.tipo === "SELECT" && (
                        <CampoOpcoesEditor values={editOpcoes} onChange={setEditOpcoes} label="Opções" />
                      )}
                      <label className="flex items-center gap-1.5 text-sm text-slate-700">
                        <input type="checkbox" checked={editObrig} onChange={(e) => setEditObrig(e.target.checked)} />
                        Obrigatório
                      </label>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-slate-800">{campo.label}</p>
                      <p className="text-xs text-slate-400">
                        {TIPO_LABELS[campo.tipo as CampoEmpresaConfig["tipo"]] ?? campo.tipo}
                        {campo.obrigatorio && (
                          <span className="ml-2 font-semibold text-amber-600">obrigatório</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {estaExcluindo ? (
                    <>
                      <span className="mr-1 text-xs text-red-700">Excluir?</span>
                      <button
                        onClick={() => confirmarExclusao(campo.id)}
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
                        onClick={() => salvarEdicao(campo)}
                        disabled={!editLabel.trim()}
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
                        onClick={() => iniciarEdicao(campo)}
                        disabled={salvando}
                        className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-500 hover:border-[#1b3383] hover:text-[#1b3383] disabled:opacity-40"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditandoId(null); setExcluindoId(campo.id); }}
                        disabled={salvando}
                        className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600 disabled:opacity-40"
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
