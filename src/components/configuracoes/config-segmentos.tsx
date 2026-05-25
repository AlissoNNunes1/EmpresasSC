"use client";

import { Button } from "@/components/ui/button";
import {
  atualizarSegmentoConfig,
  criarSegmentoConfig,
  excluirSegmentoConfig,
  type SegmentoConfig,
} from "@/services/configuracoes.service";
import { Check, ChevronDown, ChevronUp, Layers, Pencil, Plus, Settings, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Ícones lucide mais comuns para segmentos
const ICONES_OPCOES = [
  "Building2", "Briefcase", "Users2", "ShoppingCart", "Factory",
  "Leaf", "Heart", "Globe", "Zap", "Star", "Award", "Landmark",
  "Store", "Wrench", "BarChart2", "Map", "TrendingUp",
];

type Props = {
  segmentos: SegmentoConfig[];
  onReload: () => Promise<void>;
};

export function ConfigSegmentos({ segmentos, onReload }: Props) {
  const [criando, setCriando] = useState(false);
  const [novo, setNovo] = useState({ nome: "", slug: "", cor: "#1b3383", icone: "Building2", descricao: "" });
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [editandoSlug, setEditandoSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SegmentoConfig>>({});
  const [excluindoSlug, setExcluindoSlug] = useState<string | null>(null);

  function slugify(nome: string) {
    return nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function handleNomeChange(nome: string) {
    setNovo((prev) => ({ ...prev, nome, slug: prev.slug || slugify(nome) }));
  }

  async function criar() {
    setErro(null);
    setSalvandoNovo(true);
    try {
      await criarSegmentoConfig({ ...novo, descricao: novo.descricao || undefined });
      setNovo({ nome: "", slug: "", cor: "#1b3383", icone: "Building2", descricao: "" });
      setCriando(false);
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao criar segmento.");
    } finally {
      setSalvandoNovo(false);
    }
  }

  async function salvarEdicao(slug: string) {
    setErro(null);
    try {
      const payload: import("@/services/configuracoes.service").SegmentoPayload = {
        nome: editForm.nome ?? undefined as any,
        slug: editForm.slug ?? undefined as any,
        descricao: editForm.descricao ?? undefined,
        cor: editForm.cor ?? undefined,
        icone: editForm.icone ?? undefined,
        ordem: editForm.ordem,
        ativo: editForm.ativo,
      };
      await atualizarSegmentoConfig(slug, payload);
      setEditandoSlug(null);
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    }
  }

  async function toggleAtivo(seg: SegmentoConfig) {
    setErro(null);
    try {
      await atualizarSegmentoConfig(seg.slug, { ativo: !seg.ativo });
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao alterar status.");
    }
  }

  async function moverOrdem(seg: SegmentoConfig, dir: -1 | 1) {
    setErro(null);
    try {
      await atualizarSegmentoConfig(seg.slug, { ordem: seg.ordem + dir });
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao reordenar.");
    }
  }

  async function excluir(slug: string) {
    setErro(null);
    try {
      await excluirSegmentoConfig(slug);
      setExcluindoSlug(null);
      await onReload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao excluir.");
    }
  }

  const inputCls = "h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3383]/30";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Layers className="h-4 w-4 text-[#1b3383]" />
            Segmentos da Plataforma
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Segmentos aparecem automaticamente na sidebar, filtros e relatórios.
          </p>
        </div>
        {!criando && (
          <Button size="sm" onClick={() => setCriando(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo segmento
          </Button>
        )}
      </div>

      {erro && <p className="text-sm text-red-700">{erro}</p>}

      {/* Formulário de criação */}
      {criando && (
        <div className="rounded-lg border border-[#1b3383]/20 bg-[#f0f3fa] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Novo Segmento</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Nome *</label>
              <input className={inputCls} value={novo.nome} onChange={(e) => handleNomeChange(e.target.value)} placeholder="Ex: Turismo" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Slug * <span className="text-slate-400">(URL)</span></label>
              <input className={`${inputCls} font-mono`} value={novo.slug} onChange={(e) => setNovo((p) => ({ ...p, slug: slugify(e.target.value) }))} placeholder="turismo" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Cor</label>
              <div className="flex gap-2">
                <input type="color" value={novo.cor} onChange={(e) => setNovo((p) => ({ ...p, cor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border border-slate-300 p-0.5" />
                <input className={inputCls} value={novo.cor} onChange={(e) => setNovo((p) => ({ ...p, cor: e.target.value }))} placeholder="#1b3383" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Ícone <span className="text-slate-400">(Lucide)</span></label>
              <select className={inputCls} value={novo.icone} onChange={(e) => setNovo((p) => ({ ...p, icone: e.target.value }))}>
                {ICONES_OPCOES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="col-span-full space-y-1">
              <label className="text-xs font-medium text-slate-600">Descrição</label>
              <input className={inputCls} value={novo.descricao} onChange={(e) => setNovo((p) => ({ ...p, descricao: e.target.value }))} placeholder="Breve descrição do segmento" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={criar} disabled={salvandoNovo || !novo.nome || !novo.slug}>
              {salvandoNovo ? "Salvando…" : "Criar segmento"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCriando(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Lista de segmentos */}
      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {segmentos.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">Nenhum segmento cadastrado.</p>
        )}
        {segmentos.map((seg, idx) => (
          <div key={seg.id} className="flex items-center gap-3 px-4 py-3">
            {/* Cor + nome */}
            <div className="h-4 w-4 flex-shrink-0 rounded-full" style={{ backgroundColor: seg.cor ?? "#94a3b8" }} />

            {editandoSlug === seg.slug ? (
              <div className="flex flex-1 flex-wrap gap-2">
                <input className={`${inputCls} max-w-[160px]`} value={editForm.nome ?? seg.nome} onChange={(e) => setEditForm((p) => ({ ...p, nome: e.target.value }))} />
                <input type="color" value={editForm.cor ?? seg.cor ?? "#1b3383"} onChange={(e) => setEditForm((p) => ({ ...p, cor: e.target.value }))} className="h-9 w-10 cursor-pointer rounded border border-slate-300 p-0.5" />
                <select className={`${inputCls} max-w-[140px]`} value={editForm.icone ?? seg.icone ?? "Building2"} onChange={(e) => setEditForm((p) => ({ ...p, icone: e.target.value }))}>
                  {ICONES_OPCOES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
                <button onClick={() => salvarEdicao(seg.slug)} className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><Check className="h-4 w-4" /></button>
                <button onClick={() => setEditandoSlug(null)} className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{seg.nome}</p>
                  <p className="text-xs text-slate-400 font-mono">{seg.slug}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${seg.ativo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {seg.ativo ? "Ativo" : "Inativo"}
                </span>
              </>
            )}

            {/* Ações */}
            {editandoSlug !== seg.slug && (
              <div className="flex items-center gap-0.5">
                <button onClick={() => moverOrdem(seg, -1)} disabled={idx === 0} title="Mover acima" className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => moverOrdem(seg, 1)} disabled={idx === segmentos.length - 1} title="Mover abaixo" className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                <button onClick={() => toggleAtivo(seg)} title={seg.ativo ? "Desativar" : "Ativar"} className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100">
                  <span className="text-[10px] font-bold">{seg.ativo ? "OFF" : "ON"}</span>
                </button>
                <button onClick={() => { setEditandoSlug(seg.slug); setEditForm({}); }} title="Editar" className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-[#1b3383]"><Pencil className="h-3.5 w-3.5" /></button>
                {excluindoSlug === seg.slug ? (
                  <>
                    <button onClick={() => excluir(seg.slug)} className="flex h-7 w-7 items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-100"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setExcluindoSlug(null)} className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>
                  </>
                ) : (
                    <button onClick={() => setExcluindoSlug(seg.slug)} title="Excluir" className="flex h-7 w-7 items-center justify-center rounded text-red-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                )}
                <Link href={`/configuracoes/segmentos/${seg.slug}`} title="Configurar segmento" className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-[#1b3383]"><Settings className="h-3.5 w-3.5" /></Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
