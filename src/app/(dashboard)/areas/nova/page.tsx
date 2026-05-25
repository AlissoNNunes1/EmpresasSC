"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MapPin, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

type Segmento = { id: number; nome: string; slug: string; cor: string | null };

export default function NovaAreaPage() {
  const router = useRouter();
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    tipo: "",
    cor: "#1b3383",
    geoJson: "",
    segmentoId: "",
  });

  useEffect(() => {
    fetch("/api/segmentos")
      .then((r) => r.json())
      .then((data) => setSegmentos(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function set(field: keyof typeof form, value: string) {
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
      const res = await fetch("/api/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          descricao: form.descricao || undefined,
          tipo: form.tipo,
          cor: form.cor || undefined,
          geoJson: JSON.stringify(geoJsonParsed),
          segmentoId: form.segmentoId ? Number(form.segmentoId) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.error ?? "Erro ao criar área.");
        return;
      }
      router.push("/areas");
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setSalvando(false);
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
            <h2 className="text-2xl font-bold text-[#1b3383]">Nova Área</h2>
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
              placeholder="Ex: Zona Industrial Norte"
              className="form-input"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Tipo *</label>
            <input
              required
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value)}
              placeholder="Ex: Zona Industrial, Polo Comercial"
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
            placeholder="Descrição opcional da área"
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
                placeholder="#1b3383"
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
          <label className="text-sm font-semibold text-slate-700">
            GeoJSON *
            <span className="ml-2 text-xs font-normal text-slate-400">
              Formato GeoJSON válido (Feature, FeatureCollection ou Geometry)
            </span>
          </label>
          <textarea
            required
            value={form.geoJson}
            onChange={(e) => set("geoJson", e.target.value)}
            rows={8}
            placeholder={'{\n  "type": "Feature",\n  "geometry": {\n    "type": "Polygon",\n    "coordinates": [[[-46.63, -23.55], ...]]\n  },\n  "properties": {}\n}'}
            className="form-input font-mono text-xs resize-y"
          />
          <p className="text-xs text-slate-400">
            Gere o GeoJSON em{" "}
            <a href="https://geojson.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
              geojson.io
            </a>{" "}
            desenhando a área no mapa.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link href="/areas" className="btn-secondary">
            Cancelar
          </Link>
          <Button type="submit" disabled={salvando} className="btn-cta">
            <Save className="h-4 w-4" />
            {salvando ? "Salvando..." : "Criar Área"}
          </Button>
        </div>
      </form>
    </main>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
