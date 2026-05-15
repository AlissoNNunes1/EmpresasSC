"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
};

function normalizeOptions(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = value.trim();
    if (!cleaned || seen.has(cleaned)) {
      continue;
    }

    seen.add(cleaned);
    result.push(cleaned);
  }

  return result;
}

export function CampoOpcoesEditor({ values, onChange, disabled = false, placeholder = "Digite uma opção", label = "Opções" }: Props) {
  const [novaOpcao, setNovaOpcao] = useState("");

  function atualizarOpcao(index: number, valor: string) {
    const proximas = [...values];
    proximas[index] = valor;
    onChange(normalizeOptions(proximas));
  }

  function adicionarOpcao() {
    const valor = novaOpcao.trim();
    if (!valor) {
      return;
    }

    onChange(normalizeOptions([...values, valor]));
    setNovaOpcao("");
  }

  function removerOpcao(index: number) {
    onChange(values.filter((_, itemIndex) => itemIndex !== index));
  }

  function moverOpcao(index: number, direcao: "up" | "down") {
    const alvo = direcao === "up" ? index - 1 : index + 1;
    if (alvo < 0 || alvo >= values.length) {
      return;
    }

    const proximas = [...values];
    [proximas[index], proximas[alvo]] = [proximas[alvo], proximas[index]];
    onChange(normalizeOptions(proximas));
  }

  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-600">{label}</p>
        <span className="text-[11px] text-slate-400">{values.length} item(ns)</span>
      </div>

      <div className="space-y-2">
        {values.length > 0 ? (
          values.map((value, index) => (
            <div key={`${value}-${index}`} className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <button
                  type="button"
                  onClick={() => moverOpcao(index, "up")}
                  disabled={disabled || index === 0}
                  className="rounded-md border border-slate-200 p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30"
                  aria-label="Mover opção para cima"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <Input
                  value={value}
                  onChange={(event) => atualizarOpcao(index, event.target.value)}
                  disabled={disabled}
                  placeholder={placeholder}
                  className="h-9 min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={() => moverOpcao(index, "down")}
                  disabled={disabled || index === values.length - 1}
                  className="rounded-md border border-slate-200 p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30"
                  aria-label="Mover opção para baixo"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => removerOpcao(index)}
                disabled={disabled}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-30"
                aria-label="Remover opção"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Nenhuma opção cadastrada ainda.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={novaOpcao}
          onChange={(event) => setNovaOpcao(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              adicionarOpcao();
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className="h-9 flex-1"
        />
        <Button type="button" variant="outline" onClick={adicionarOpcao} disabled={disabled || !novaOpcao.trim()} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
