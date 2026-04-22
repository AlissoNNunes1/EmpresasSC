"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
  itensPorPagina: number;
  opcoesItensPorPagina?: number[];
  onMudarPagina: (pagina: number) => void;
  onMudarItensPorPagina?: (itens: number) => void;
};

export function Pagination({
  paginaAtual,
  totalPaginas,
  totalItens,
  itensPorPagina,
  opcoesItensPorPagina = [12, 24, 48],
  onMudarPagina,
  onMudarItensPorPagina,
}: PaginationProps) {
  if (totalPaginas <= 1) {
    return null;
  }

  const inicio = (paginaAtual - 1) * itensPorPagina + 1;
  const fim = Math.min(totalItens, paginaAtual * itensPorPagina);

  function paginasVisiveis(): number[] {
    const paginas = new Set<number>([1, totalPaginas, paginaAtual - 1, paginaAtual, paginaAtual + 1]);
    return Array.from(paginas)
      .filter((pagina) => pagina >= 1 && pagina <= totalPaginas)
      .sort((a, b) => a - b);
  }

  const listaPaginas = paginasVisiveis();

  return (
    <nav className="flex flex-col gap-3 border-t border-slate-200 pt-4" aria-label="Paginação da tabela de empresas">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Exibindo <strong>{inicio}</strong> a <strong>{fim}</strong> de <strong>{totalItens}</strong> registros.
        </p>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-700">Página {paginaAtual} de {totalPaginas}</span>
          {onMudarItensPorPagina ? (
            <label className="flex items-center gap-2">
              <span>Itens por página</span>
              <select
                value={itensPorPagina}
                onChange={(event) => onMudarItensPorPagina(Number(event.target.value))}
                className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700"
                aria-label="Selecionar quantidade de itens por página"
              >
                {opcoesItensPorPagina.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onMudarPagina(paginaAtual - 1)}
          disabled={paginaAtual === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {listaPaginas.map((pagina, index) => {
          const anterior = listaPaginas[index - 1];
          const mostrarReticencias = typeof anterior === "number" && pagina - anterior > 1;

          return (
            <div key={`pagina-${pagina}`} className="flex items-center gap-1">
              {mostrarReticencias ? <span className="px-1 text-slate-500">...</span> : null}
              <Button
                type="button"
                size="sm"
                variant={pagina === paginaAtual ? "default" : "outline"}
                onClick={() => onMudarPagina(pagina)}
                aria-label={`Ir para página ${pagina}`}
                aria-current={pagina === paginaAtual ? "page" : undefined}
              >
                {pagina}
              </Button>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onMudarPagina(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
