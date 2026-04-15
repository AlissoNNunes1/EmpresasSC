"use client";

import { ConfigCategorias } from "@/components/configuracoes/config-categorias";
import { ConfigGeral } from "@/components/configuracoes/config-geral";
import { ConfigSeguranca } from "@/components/configuracoes/config-seguranca";
import {
    listarCategoriasConfig,
    obterConfiguracao,
    salvarConfiguracao,
    type CategoriaConfig,
    type ConfiguracaoPayload,
    type ConfiguracaoSistema,
} from "@/services/configuracoes.service";
import { useMemo, useState } from "react";

type Aba = "geral" | "categorias" | "seguranca";

type Props = {
  initialConfig: ConfiguracaoSistema;
  initialCategorias: CategoriaConfig[];
};

export function ConfigPanel({ initialConfig, initialCategorias }: Props) {
  const [aba, setAba] = useState<Aba>("geral");
  const [config, setConfig] = useState(initialConfig);
  const [categorias, setCategorias] = useState(initialCategorias);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const abas = useMemo(
    () => [
      { id: "geral" as const, label: "Geral e Parametros" },
      { id: "categorias" as const, label: "Categorias" },
      { id: "seguranca" as const, label: "Seguranca e Backup" },
    ],
    []
  );

  async function reloadAll() {
    setLoading(true);
    setErro(null);

    try {
      const [configAtual, categoriasAtuais] = await Promise.all([
        obterConfiguracao(),
        listarCategoriasConfig(),
      ]);

      setConfig(configAtual);
      setCategorias(categoriasAtuais);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao recarregar configuracoes.");
    } finally {
      setLoading(false);
    }
  }

  async function salvar(payload: ConfiguracaoPayload) {
    setLoading(true);
    setErro(null);
    setMensagem(null);

    try {
      const updated = await salvarConfiguracao(payload);
      setConfig(updated);
      setMensagem("Configuracoes salvas com sucesso.");
      await reloadAll();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao salvar configuracoes.");
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {abas.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              item.id === aba
                ? "btn-cta"
                : "btn-secondary"
            }
            onClick={() => {
              setMensagem(null);
              setErro(null);
              setAba(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mensagem ? <p className="text-sm font-medium text-emerald-700">{mensagem}</p> : null}
      {erro ? <p className="text-sm font-medium text-red-700">{erro}</p> : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        {aba === "geral" ? (
          <ConfigGeral config={config} categorias={categorias} onSave={salvar} loading={loading} />
        ) : null}

        {aba === "categorias" ? (
          <ConfigCategorias categorias={categorias} onReload={reloadAll} loading={loading} />
        ) : null}

        {aba === "seguranca" ? (
          <ConfigSeguranca config={config} onSave={salvar} loading={loading} />
        ) : null}
      </div>
    </div>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
