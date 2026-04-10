"use client";

export default function EmpresasError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-xl font-bold text-red-800">Erro ao carregar empresas</h2>
      <p className="mt-2 text-sm text-red-700">
        Ocorreu uma falha ao consultar os dados desta tela.
      </p>
      <button type="button" className="btn-cta mt-4" onClick={() => reset()}>
        Tentar novamente
      </button>
    </main>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
