"use client";

import type { CategoriaOption } from "@/types/empresa";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Filtros = {
  termo?: string;
  categoriaId?: number;
  bairro?: string;
  porte?: string;
  situacao?: string;
  minEmpregados?: number;
  maxEmpregados?: number;
};

type Props = {
  filtros: Filtros;
  categorias: CategoriaOption[];
};

const ESTADO_VAZIO = {
  termo: "",
  categoriaId: "",
  bairro: "",
  porte: "",
  situacao: "",
  minEmpregados: "",
  maxEmpregados: "",
};

export function EmpresaFiltros({ filtros, categorias }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [valores, setValores] = useState({
    termo: filtros.termo ?? "",
    categoriaId: filtros.categoriaId?.toString() ?? "",
    bairro: filtros.bairro ?? "",
    porte: filtros.porte ?? "",
    situacao: filtros.situacao ?? "",
    minEmpregados: filtros.minEmpregados?.toString() ?? "",
    maxEmpregados: filtros.maxEmpregados?.toString() ?? "",
  });

  function set(campo: keyof typeof ESTADO_VAZIO, valor: string) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams();
    Object.entries(valores).forEach(([key, value]) => {
      if (value !== "") qs.set(key, value);
    });
    const sortBy = searchParams.get("sortBy");
    const sortDir = searchParams.get("sortDir");
    if (sortBy) qs.set("sortBy", sortBy);
    if (sortDir) qs.set("sortDir", sortDir);
    startTransition(() => {
      router.replace(`/empresas?${qs.toString()}`);
    });
  }

  function handleLimpar() {
    setValores(ESTADO_VAZIO);
    const qs = new URLSearchParams();
    const sortBy = searchParams.get("sortBy");
    const sortDir = searchParams.get("sortDir");
    if (sortBy) qs.set("sortBy", sortBy);
    if (sortDir) qs.set("sortDir", sortDir);
    startTransition(() => {
      router.replace(qs.toString() ? `/empresas?${qs.toString()}` : "/empresas");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="filtro-termo" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Busca textual
          </label>
          <input
            id="filtro-termo"
            value={valores.termo}
            onChange={(e) => set("termo", e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500"
            placeholder="Razão social, fantasia ou CNPJ"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="filtro-categoria" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Categoria
          </label>
          <select
            id="filtro-categoria"
            value={valores.categoriaId}
            onChange={(e) => set("categoriaId", e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
          >
            <option value="">Todas categorias</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="filtro-bairro" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Localização
          </label>
          <input
            id="filtro-bairro"
            value={valores.bairro}
            onChange={(e) => set("bairro", e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500"
            placeholder="Bairro"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="filtro-porte" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Porte
          </label>
          <select
            id="filtro-porte"
            value={valores.porte}
            onChange={(e) => set("porte", e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
          >
            <option value="">Todos portes</option>
            <option value="MEI">MEI</option>
            <option value="MICRO">Micro</option>
            <option value="PEQUENA">Pequena</option>
            <option value="MEDIA">Média</option>
            <option value="GRANDE">Grande</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="filtro-situacao" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Situação
          </label>
          <select
            id="filtro-situacao"
            value={valores.situacao}
            onChange={(e) => set("situacao", e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
          >
            <option value="">Todas situações</option>
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
            <option value="SUSPENSA">Suspensa</option>
            <option value="ENCERRADA">Encerrada</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Nº de empregados
          </label>
          <div className="flex items-center gap-2">
            <input
              id="filtro-min-empregados"
              type="number"
              min={0}
              value={valores.minEmpregados}
              onChange={(e) => set("minEmpregados", e.target.value)}
              className="h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
              placeholder="Mín."
            />
            <span className="flex-shrink-0 text-xs font-medium text-slate-400">até</span>
            <input
              id="filtro-max-empregados"
              type="number"
              min={0}
              value={valores.maxEmpregados}
              onChange={(e) => set("maxEmpregados", e.target.value)}
              className="h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
              placeholder="Máx."
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleLimpar}
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
        >
          Limpar filtros
        </button>
        <button type="submit" disabled={isPending} className="btn-cta h-10 px-5 disabled:opacity-70">
          {isPending ? "Filtrando…" : "Aplicar filtros"}
        </button>
      </div>
    </form>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
