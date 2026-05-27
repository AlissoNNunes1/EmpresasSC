"use client";

import { apiRequest } from "@/services/api";
import { useCallback, useState } from "react";

type CampoGlobal = {
  id: number;
  nome: string;
  label: string;
  tipo: string;
  builtin: boolean;
  visivel: boolean;
  ordem: number;
  ativoNoSegmento: boolean;
  imutavel: boolean;
};

type Props = {
  segmentoSlug: string;
  initialCampos: CampoGlobal[];
};

const TIPO_LABELS: Record<string, string> = {
  TEXTO: "Texto",
  NUMERO: "Número",
  SELECT: "Seleção",
  TEXTAREA: "Texto longo",
  DATA: "Data",
};

export function ConfigVisibilidadeCampos({ segmentoSlug, initialCampos }: Props) {
  const [campos, setCampos] = useState<CampoGlobal[]>(initialCampos);
  const [salvando, setSalvando] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const toggle = useCallback(
    async (campo: CampoGlobal) => {
      if (campo.imutavel) return;
      const novoAtivo = !campo.ativoNoSegmento;
      setSalvando(campo.id);
      setErro(null);

      // Optimistic update
      setCampos((prev) =>
        prev.map((c) => (c.id === campo.id ? { ...c, ativoNoSegmento: novoAtivo } : c))
      );

      try {
        await apiRequest(`/api/segmentos/${segmentoSlug}/campos/visibilidade`, {
          method: "PUT",
          body: { campoId: campo.id, ativo: novoAtivo },
        });
      } catch (e) {
        // Revert on error
        setCampos((prev) =>
          prev.map((c) =>
            c.id === campo.id ? { ...c, ativoNoSegmento: campo.ativoNoSegmento } : c
          )
        );
        setErro(e instanceof Error ? e.message : "Erro ao salvar.");
      } finally {
        setSalvando(null);
      }
    },
    [segmentoSlug]
  );

  const ativos = campos.filter((c) => c.ativoNoSegmento).length;
  const total = campos.length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        {ativos} de {total} campos globais habilitados neste segmento.
        Campos <span className="font-semibold text-slate-700">obrigatórios do sistema</span> não
        podem ser desativados.
      </p>

      {erro && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{erro}</p>
      )}

      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {campos.map((campo) => {
          const isSaving = salvando === campo.id;

          return (
            <div
              key={campo.id}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                campo.ativoNoSegmento ? "" : "opacity-50"
              }`}
            >
              {/* Toggle switch */}
              <button
                type="button"
                disabled={campo.imutavel || isSaving}
                onClick={() => toggle(campo)}
                aria-label={campo.ativoNoSegmento ? "Desativar campo" : "Ativar campo"}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                  campo.ativoNoSegmento ? "bg-[#1b3383]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    campo.ativoNoSegmento ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{campo.label}</p>
                <p className="text-xs text-slate-400">
                  <span className="font-mono">{campo.nome}</span>
                  <span className="mx-1.5">·</span>
                  {TIPO_LABELS[campo.tipo] ?? campo.tipo}
                  {campo.builtin && (
                    <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                      padrão
                    </span>
                  )}
                  {campo.imutavel && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      sempre visível
                    </span>
                  )}
                </p>
              </div>

              <span
                className={`text-xs font-semibold ${
                  campo.ativoNoSegmento ? "text-[#1b3383]" : "text-slate-400"
                }`}
              >
                {isSaving ? "…" : campo.ativoNoSegmento ? "Ativo" : "Oculto"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
