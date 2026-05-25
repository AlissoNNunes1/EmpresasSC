"use client";

import { ConfigCampos } from "@/components/configuracoes/config-campos";
import { ConfigCategorias } from "@/components/configuracoes/config-categorias";
import { ConfigGeral } from "@/components/configuracoes/config-geral";
import { ConfigSegmentos } from "@/components/configuracoes/config-segmentos";
import { ConfigSeguranca } from "@/components/configuracoes/config-seguranca";
import {
    listarCategoriasConfig,
    listarSegmentosConfig,
    obterConfiguracao,
    salvarConfiguracao,
    type CategoriaConfig,
    type ConfiguracaoPayload,
    type ConfiguracaoSistema,
    type SegmentoConfig,
} from "@/services/configuracoes.service";
import { listarCampos, type CampoEmpresaConfig } from "@/services/campos.service";
import { FormInput, Layers, Shield, SlidersHorizontal, Tag } from "lucide-react";
import { useMemo, useState } from "react";

type Aba = "geral" | "categorias" | "segmentos" | "campos" | "seguranca";

type Props = {
  initialConfig: ConfiguracaoSistema;
  initialCategorias: CategoriaConfig[];
  initialCampos: CampoEmpresaConfig[];
  initialSegmentos: SegmentoConfig[];
};

export function ConfigPanel({ initialConfig, initialCategorias, initialCampos, initialSegmentos }: Props) {
  const [aba, setAba] = useState<Aba>("geral");
  const [config, setConfig] = useState(initialConfig);
  const [categorias, setCategorias] = useState(initialCategorias);
  const [campos, setCampos] = useState(initialCampos);
  const [segmentos, setSegmentos] = useState(initialSegmentos);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const abas = useMemo(
    () => [
      { id: "geral" as const,      label: "Geral",     icon: SlidersHorizontal },
      { id: "segmentos" as const,  label: "Segmentos", icon: Layers },
      { id: "categorias" as const, label: "Categorias",icon: Tag },
      { id: "campos" as const,     label: "Campos",    icon: FormInput },
      { id: "seguranca" as const,  label: "Segurança", icon: Shield },
    ],
    []
  );

  async function reloadAll() {
    setLoading(true);
    setErro(null);
    try {
      const [configAtual, categoriasAtuais, camposAtuais, segmentosAtuais] = await Promise.all([
        obterConfiguracao(),
        listarCategoriasConfig(),
        listarCampos(),
        listarSegmentosConfig(),
      ]);
      setConfig(configAtual);
      setCategorias(categoriasAtuais);
      setCampos(camposAtuais);
      setSegmentos(segmentosAtuais);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao recarregar configurações.");
    } finally {
      setLoading(false);
    }
  }

  async function reloadCampos() {
    const camposAtuais = await listarCampos();
    setCampos(camposAtuais);
  }

  async function salvar(payload: ConfiguracaoPayload) {
    setLoading(true);
    setErro(null);
    setMensagem(null);

    try {
      const updated = await salvarConfiguracao(payload);
      setConfig(updated);
      setMensagem("Configurações salvas com sucesso.");
      await reloadAll();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao salvar configurações.");
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {abas.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`flex items-center gap-2 ${item.id === aba ? "btn-cta" : "btn-secondary"}`}
              onClick={() => {
                setMensagem(null);
                setErro(null);
                setAba(item.id);
              }}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {mensagem ? <p className="text-sm font-medium text-emerald-700">{mensagem}</p> : null}
      {erro ? <p className="text-sm font-medium text-red-700">{erro}</p> : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        {aba === "geral" ? (
          <ConfigGeral config={config} categorias={categorias} onSave={salvar} loading={loading} />
        ) : null}

        {aba === "segmentos" ? (
          <ConfigSegmentos segmentos={segmentos} onReload={reloadAll} />
        ) : null}

        {aba === "categorias" ? (
          <ConfigCategorias categorias={categorias} onReload={reloadAll} loading={loading} />
        ) : null}

        {aba === "campos" ? (
          <ConfigCampos campos={campos} onReload={reloadCampos} />
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
