import Link from "next/link";

export function EmpresaForm() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-900">Cadastro de Empresa</h2>
      <p className="mt-1 text-sm text-slate-600">Use o formulario completo na tela principal de empresas.</p>
      <div className="mt-3">
        <Link href="/empresas" className="inline-flex h-10 items-center rounded-md bg-sky-700 px-4 text-sm font-medium text-white hover:bg-sky-800">
          Ir para empresas
        </Link>
      </div>
    </div>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
