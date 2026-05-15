"use client";

import { CampoOpcoesEditor } from "@/components/configuracoes/campo-opcoes-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    atualizarCampo,
    criarCampo,
    excluirCampo,
    parseCampoOpcoes,
    reordenarCampos,
    type CampoEmpresaConfig,
} from "@/services/campos.service";
import {
    Check,
    ChevronDown,
    ChevronUp,
    GripVertical,
    Pencil,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import { useState } from "react";

type Props = {
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

const IMUTAVEIS = ["cnpj", "razaoSocial"];

export function ConfigCampos({ campos, onReload }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Novo campo
  const [novoNome, setNovoNome] = useState("");
  const [novoLabel, setNovoLabel] = useState("");
  const [novoTipo, setNovoTipo] = useState<CampoEmpresaConfig["tipo"]>("TEXTO");
  const [novoObrig, setNovoObrig] = useState(false);
  const [novasOpcoes, setNovasOpcoes] = useState<string[]>([]);

  // Edição inline
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editObrig, setEditObrig] = useState(false);
  const [editOpcoes, setEditOpcoes] = useState<string[]>([]);

  // Exclusão
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  async function criar() {
    if (!novoNome.trim() || !novoLabel.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      const opcoes = novoTipo === "SELECT"
        ? novasOpcoes
        : undefined;
      await criarCampo({ nome: novoNome.trim(), label: novoLabel.trim(), tipo: novoTipo, obrigatorio: novoObrig, opcoes });
      setNovoNome(""); setNovoLabel(""); setNovoTipo("TEXTO"); setNovoObrig(false); setNovasOpcoes([]);
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar campo.");
    } finally { setSalvando(false); }
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
      const opcoes = campo.tipo === "SELECT" ? editOpcoes : undefined;
      await atualizarCampo(campo.id, { label: editLabel.trim(), obrigatorio: editObrig, opcoes: opcoes ?? null });
      setEditandoId(null);
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar campo.");
    } finally { setSalvando(false); }
  }

  async function toggleVisivel(campo: CampoEmpresaConfig) {
    setSalvando(true);
    setErro(null);
    try {
      await atualizarCampo(campo.id, { visivel: !campo.visivel });
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao atualizar visibilidade.");
    } finally { setSalvando(false); }
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
    } finally { setSalvando(false); }
  }

  async function moverCampo(index: number, direcao: "up" | "down") {
    const novosCampos = [...campos];
    const alvo = direcao === "up" ? index - 1 : index + 1;
    if (alvo < 0 || alvo >= novosCampos.length) return;
    [novosCampos[index], novosCampos[alvo]] = [novosCampos[alvo], novosCampos[index]];
    setSalvando(true);
    try {
      await reordenarCampos(novosCampos.map((c) => c.id));
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao reordenar.");
    } finally { setSalvando(false); }
  }

  return (
    <div className="space-y-5">
      {/* Formulário de novo campo */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Plus className="h-4 w-4 text-[#1b3383]" />
          Adicionar campo personalizado
        </h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Nome interno *</label>
            <input
              placeholder="ex: site, telefone"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              className="h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Label exibida *</label>
            <input
              placeholder="ex: Site, Telefone"
              value={novoLabel}
              onChange={(e) => setNovoLabel(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Tipo</label>
            <select
              value={novoTipo}
              onChange={(e) => setNovoTipo(e.target.value as CampoEmpresaConfig["tipo"])}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm"
            >
              {Object.entries(TIPO_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-1.5 text-sm text-slate-700">
              <input type="checkbox" checked={novoObrig} onChange={(e) => setNovoObrig(e.target.checked)} />
              Obrigatório
            </label>
          </div>
        </div>
        {novoTipo === "SELECT" && (
          <div className="mt-2">
            <CampoOpcoesEditor values={novasOpcoes} onChange={setNovasOpcoes} label="Opções disponíveis" />
          </div>
        )}
        <Button
          type="button"
          onClick={criar}
          disabled={salvando || !novoNome.trim() || !novoLabel.trim()}
          className="mt-3 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {salvando ? "Criando…" : "Adicionar campo"}
        </Button>
      </div>

      {erro ? (
        <p className="flex items-center gap-1.5 text-sm text-red-700">
          <X className="h-4 w-4 flex-shrink-0" />{erro}
        </p>
      ) : null}

      {/* Tabela de campos */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="w-8 px-2 py-2.5" />
              <th className="px-3 py-2.5 font-semibold text-slate-700">Label / Nome interno</th>
              <th className="px-3 py-2.5 font-semibold text-slate-700">Tipo</th>
              <th className="px-3 py-2.5 font-semibold text-slate-700">Visível</th>
              <th className="px-3 py-2.5 font-semibold text-slate-700">Obrigatório</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {campos.map((campo, index) => {
              const estaEditando = editandoId === campo.id;
              const estaExcluindo = excluindoId === campo.id;
              const imutavel = IMUTAVEIS.includes(campo.nome);

              return (
                <tr key={campo.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50">
                  {/* Reordenar */}
                  <td className="px-2 py-2">
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moverCampo(index, "up")}
                        disabled={salvando || index === 0}
                        className="text-slate-300 hover:text-slate-600 disabled:opacity-20"
                        title="Mover para cima"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <GripVertical className="h-3.5 w-3.5 text-slate-300" />
                      <button
                        type="button"
                        onClick={() => moverCampo(index, "down")}
                        disabled={salvando || index === campos.length - 1}
                        className="text-slate-300 hover:text-slate-600 disabled:opacity-20"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Label / Nome */}
                  <td className="px-3 py-2">
                    {estaEditando ? (
                      <input
                        autoFocus
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") salvarEdicao(campo); if (e.key === "Escape") setEditandoId(null); }}
                        className="h-8 w-full rounded-md border border-[#1b3383] px-2 text-sm ring-1 ring-[#1b3383]/30"
                      />
                    ) : (
                      <div>
                        <span className="font-medium text-slate-800">{campo.label}</span>
                        <span className="ml-2 font-mono text-xs text-slate-400">{campo.nome}</span>
                        {campo.builtin && (
                          <Badge className="ml-2 bg-blue-50 text-blue-700 text-[10px]">padrão</Badge>
                        )}
                      </div>
                    )}
                    {estaEditando && campo.tipo === "SELECT" && (
                      <div className="mt-2">
                        <CampoOpcoesEditor values={editOpcoes} onChange={setEditOpcoes} label="Opções do campo" />
                      </div>
                    )}
                  </td>

                  {/* Tipo */}
                  <td className="px-3 py-2 text-sm text-slate-600">
                    {TIPO_LABELS[campo.tipo as CampoEmpresaConfig["tipo"]] ?? campo.tipo}
                  </td>

                  {/* Visível */}
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleVisivel(campo)}
                      disabled={salvando || imutavel}
                      className={`h-6 rounded-full px-2.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                        campo.visivel
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {campo.visivel ? "Sim" : "Não"}
                    </button>
                  </td>

                  {/* Obrigatório */}
                  <td className="px-3 py-2">
                    {estaEditando ? (
                      <label className="flex items-center gap-1.5 text-sm text-slate-700">
                        <input type="checkbox" checked={editObrig} onChange={(e) => setEditObrig(e.target.checked)} />
                        Obrigatório
                      </label>
                    ) : (
                      <span className={`text-xs font-semibold ${campo.obrigatorio ? "text-slate-800" : "text-slate-400"}`}>
                        {campo.obrigatorio ? "Sim" : "Não"}
                      </span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-3 py-2">
                    {estaExcluindo ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-red-700">Excluir &quot;{campo.label}&quot;?</span>
                        <button
                          type="button"
                          onClick={() => confirmarExclusao(campo.id)}
                          className="flex h-7 items-center gap-1 rounded-md bg-red-600 px-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          <Check className="h-3 w-3" /> Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setExcluindoId(null)}
                          className="flex h-7 items-center gap-1 rounded-md border border-slate-300 px-2 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          <X className="h-3 w-3" /> Cancelar
                        </button>
                      </div>
                    ) : estaEditando ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => salvarEdicao(campo)}
                          disabled={!editLabel.trim()}
                          title="Salvar"
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditandoId(null)}
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
                          onClick={() => iniciarEdicao(campo)}
                          disabled={salvando}
                          title="Editar label"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-[#1b3383] hover:text-[#1b3383] disabled:opacity-40"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {!campo.builtin && (
                          <button
                            type="button"
                            onClick={() => { setEditandoId(null); setExcluindoId(campo.id); }}
                            disabled={salvando}
                            title="Excluir campo"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Campos <Badge className="bg-blue-50 text-blue-700 text-[10px]">padrão</Badge> não podem ser excluídos, mas você pode renomear a label e alterar a visibilidade.
        Os campos <strong>CNPJ</strong> e <strong>Razão Social</strong> são sempre visíveis.
      </p>
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
