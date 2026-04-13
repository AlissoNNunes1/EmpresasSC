"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { atualizarCategoriaConfig, criarCategoriaConfig, type CategoriaConfig } from "@/services/configuracoes.service";

type Props = {
  categorias: CategoriaConfig[];
  onReload: () => Promise<void>;
  loading: boolean;
};

export function ConfigCategorias({ categorias, onReload, loading }: Props) {
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState<"ATIVO" | "INATIVO">("ATIVO");
  const [erro, setErro] = useState<string | null>(null);

  async function criar() {
    setErro(null);

    try {
      await criarCategoriaConfig({ nome: nome.trim(), status });
      setNome("");
      setStatus("ATIVO");
      await onReload();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao criar categoria.");
    }
  }

  async function alternar(item: CategoriaConfig) {
    setErro(null);

    try {
      await atualizarCategoriaConfig(item.id, {
        status: item.status === "ATIVO" ? "INATIVO" : "ATIVO",
      });
      await onReload();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao atualizar categoria.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h4 className="text-sm font-semibold text-slate-900">Nova categoria</h4>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px_auto]">
          <input
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            placeholder="Nome da categoria"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
          />
          <select
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as "ATIVO" | "INATIVO")}
          >
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <Button type="button" onClick={criar} disabled={loading || !nome.trim()}>
            Criar
          </Button>
        </div>
      </div>

      {erro ? <p className="text-sm font-medium text-red-700">{erro}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Nome</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-600" colSpan={3}>
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            ) : (
              categorias.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-3 py-2">{item.nome}</td>
                  <td className="px-3 py-2">
                    <Badge className={item.status === "ATIVO" ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-700"}>
                      {item.status === "ATIVO" ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => alternar(item)} disabled={loading}>
                      {item.status === "ATIVO" ? "Desativar" : "Ativar"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
