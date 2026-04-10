"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-xl font-bold text-red-800">Erro ao carregar o dashboard</h2>
      <p className="mt-2 text-sm text-red-700">
        Ocorreu uma falha durante a carga dos dados. Tente novamente.
      </p>
      <button
        className="btn-cta mt-4"
        onClick={() => reset()}
        type="button"
      >
        Tentar novamente
      </button>
    </main>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
