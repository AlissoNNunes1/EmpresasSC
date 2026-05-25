"use client";

import { type SegmentoBasico } from "@/types/usuario";

type Props = {
  segmentos: SegmentoBasico[];
  segmentoSlug?: string | null;
  onChange: (slug?: string) => void;
};

export default function MapaControls({ segmentos, segmentoSlug, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-700">Segmento</label>
      <select className="h-9 rounded-md border border-slate-300 px-2 text-sm" value={segmentoSlug ?? ""} onChange={(e) => onChange(e.target.value || undefined)}>
        <option value="">Todos</option>
        {segmentos.map((s) => (
          <option key={s.id} value={s.slug as string}>{s.nome}</option>
        ))}
      </select>
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
///    \___ \___ ) \/ (
//\_/\_(____(____|____/
