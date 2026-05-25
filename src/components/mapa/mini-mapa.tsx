"use client";

import Link from "next/link";

export default function MiniMapa() {
  return (
    <div className="minimap w-full">
      <Link href="/mapa" aria-label="Abrir mapa completo" className="group block">
        <div className="relative h-40 w-full overflow-hidden rounded-md border border-slate-200 bg-gradient-to-br from-white to-slate-50">
          <svg
            role="img"
            aria-hidden={false}
            className="h-full w-full"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            <rect width="100%" height="100%" fill="#f8fafc" />
            <g fill="#e6eefc" stroke="#e1e8f8">
              <rect x="8" y="20" width="120" height="60" rx="6" />
              <rect x="140" y="40" width="220" height="40" rx="6" />
              <rect x="30" y="100" width="120" height="70" rx="6" />
            </g>
            <g fill="#cfe0ff">
              <circle cx="260" cy="60" r="6" />
              <circle cx="320" cy="120" r="5" />
              <circle cx="200" cy="140" r="4" />
            </g>
            <text x="14" y="16" fill="#3b4b88" fontSize="12" fontWeight="700">Mini-mapa</text>
          </svg>
        </div>
        <p className="mt-2 text-xs text-slate-500">Clique para abrir o mapa interativo completo</p>
      </Link>
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
///    \___ \___ ) \/ (
//\_/\_(____(____|____/
