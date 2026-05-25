"use client";

import dynamic from "next/dynamic";
import type { EmpresaPin, AreaOverlay } from "./mapa-interativo";

const MapaInterativo = dynamic(() => import("./mapa-interativo"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
      Carregando mapa…
    </div>
  ),
});

type Props = {
  empresas: EmpresaPin[];
  areas: AreaOverlay[];
  height?: string | number;
};

export default function MapaContainer({ empresas, areas, height = "520px" }: Props) {
  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-lg border border-slate-200">
      <MapaInterativo empresas={empresas} areas={areas} />
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
