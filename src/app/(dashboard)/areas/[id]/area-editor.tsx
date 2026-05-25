"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";

type Segmento = { id: number; nome: string; slug: string; cor: string | null };
type Area = {
  id: number; nome: string; descricao: string | null; tipo: string;
  cor: string | null; geoJson: string; segmentoId: number | null; ativo: boolean;
};

type Props = { area: Area; segmentos: Segmento[] };

export default function AreaEditor({ area, segmentos }: Props) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: area.nome,
    descricao: area.descricao ?? "",
    tipo: area.tipo,
    cor: area.cor ?? "#1b3383",
    geoJson: (() => { try { return JSON.stringify(JSON.parse(area.geoJson), null, 2); } catch { return area.geoJson; } })(),
    segmentoId: area.segmentoId ? String(area.segmentoId) : "",
    ativo: area.ativo,
  });

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    let geoJsonParsed: unknown;
    try {
      geoJsonParsed = JSON.parse(form.geoJson);
    } catch {
      setErro("GeoJSON inválido. Verifique o formato JSON.");
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch(`/api/areas/${area.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          descricao: form.descricao || undefined,
          tipo: form.tipo,
          cor: form.cor || undefined,
          geoJson: JSON.stringify(geoJsonParsed),
          segmentoId: form.segmentoId ? Number(form.segmentoId) : null,
          ativo: form.ativo,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.error ?? "Erro ao salvar.");
        return;
      }
      router.push("/areas");
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir() {
    if (!confirm(`Excluir a área "${area.nome}" permanentemente?`)) return;
    setExcluindo(true);
    try {
      const res = await fetch(`/api/areas/${area.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.error ?? "Erro ao excluir.");
        return;
      }
      router.push("/areas");
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3">
          <Link href="/areas" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Zoneamento</p>
            <h2 className="text-2xl font-bold text-[#1b3383]">Editar Área</h2>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[#d7deef] bg-white p-5 shadow-sm">
        {erro && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Nome *</label>
            <input
              required
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              className="form-input"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Tipo *</label>
            <input
              required
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">Descrição</label>
          <textarea
            value={form.descricao}
            onChange={(e) => set("descricao", e.target.value)}
            rows={2}
            className="form-input resize-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Cor</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.cor}
                onChange={(e) => set("cor", e.target.value)}
                className="h-9 w-14 cursor-pointer rounded border border-slate-300"
              />
              <input
                value={form.cor}
                onChange={(e) => set("cor", e.target.value)}
                className="form-input flex-1"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Segmento</label>
            <select
              value={form.segmentoId}
              onChange={(e) => set("segmentoId", e.target.value)}
              className="form-input"
            >
              <option value="">Nenhum (geral)</option>
              {segmentos.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={form.ativo}
              onChange={(e) => set("ativo", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="ativo" className="text-sm font-semibold text-slate-700">Área ativa</label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">
            GeoJSON *
            <a href="https://geojson.io" target="_blank" rel="noopener noreferrer" className="ml-2 text-xs font-normal text-[#1b3383] underline hover:opacity-70">
              Editar em geojson.io
            </a>
          </label>
          <textarea
            required
            value={form.geoJson}
            onChange={(e) => set("geoJson", e.target.value)}
            rows={10}
            className="form-input font-mono text-xs resize-y"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={excluindo}
            onClick={handleExcluir}
            className="text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4" />
            {excluindo ? "Excluindo..." : "Excluir"}
          </Button>
          <div className="flex gap-2">
            <Link href="/areas" className="btn-secondary">Cancelar</Link>
            <Button type="submit" disabled={salvando} className="btn-cta">
              <Save className="h-4 w-4" />
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
