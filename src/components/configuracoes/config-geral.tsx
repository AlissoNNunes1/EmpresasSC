"use client";

import { Button } from "@/components/ui/button";
import type { CategoriaConfig, ConfiguracaoPayload, ConfiguracaoSistema } from "@/services/configuracoes.service";
import { useState } from "react";

type Props = {
  config: ConfiguracaoSistema;
  categorias: CategoriaConfig[];
  onSave: (payload: ConfiguracaoPayload) => Promise<void>;
  loading: boolean;
};

export function ConfigGeral({ config, categorias, onSave, loading }: Props) {
  const [form, setForm] = useState<ConfiguracaoPayload>({
    nomeSistema: config.nomeSistema,
    nomeMunicipio: config.nomeMunicipio,
    logoUrl: config.logoUrl,
    emailInstitucional: config.emailInstitucional,
    minEmpregadosPequena: config.minEmpregadosPequena,
    maxEmpregadosPequena: config.maxEmpregadosPequena,
    minEmpregadosMedia: config.minEmpregadosMedia,
    maxEmpregadosMedia: config.maxEmpregadosMedia,
    categoriaPadraoId: config.categoriaPadraoId,
    politicaSenhaMinCaracteres: config.politicaSenhaMinCaracteres,
    tempoSessaoMinutos: config.tempoSessaoMinutos,
    controleLoginAtivo: config.controleLoginAtivo,
    integracaoCnpjAtiva: config.integracaoCnpjAtiva,
    webhookUrl: config.webhookUrl,
  });
  const [erro, setErro] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    if (form.minEmpregadosPequena > form.maxEmpregadosPequena) {
      setErro("Faixa de pequena empresa invalida.");
      return;
    }

    if (form.minEmpregadosMedia > form.maxEmpregadosMedia) {
      setErro("Faixa de media empresa invalida.");
      return;
    }

    try {
      await onSave(form);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao salvar configuracoes gerais.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Nome do sistema</label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            value={form.nomeSistema}
            onChange={(event) => setForm((prev) => ({ ...prev, nomeSistema: event.target.value }))}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Municipio</label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            value={form.nomeMunicipio}
            onChange={(event) => setForm((prev) => ({ ...prev, nomeMunicipio: event.target.value }))}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Email institucional</label>
          <input
            type="email"
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            value={form.emailInstitucional}
            onChange={(event) => setForm((prev) => ({ ...prev, emailInstitucional: event.target.value }))}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">URL da logo</label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            value={form.logoUrl ?? ""}
            onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value || null }))}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h4 className="text-sm font-semibold text-slate-900">Parametros do sistema</h4>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Min pequena</label>
            <input
              type="number"
              min={0}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              value={form.minEmpregadosPequena}
              onChange={(event) => setForm((prev) => ({ ...prev, minEmpregadosPequena: Number(event.target.value || 0) }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Max pequena</label>
            <input
              type="number"
              min={0}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              value={form.maxEmpregadosPequena}
              onChange={(event) => setForm((prev) => ({ ...prev, maxEmpregadosPequena: Number(event.target.value || 0) }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Min media</label>
            <input
              type="number"
              min={0}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              value={form.minEmpregadosMedia}
              onChange={(event) => setForm((prev) => ({ ...prev, minEmpregadosMedia: Number(event.target.value || 0) }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Max media</label>
            <input
              type="number"
              min={0}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              value={form.maxEmpregadosMedia}
              onChange={(event) => setForm((prev) => ({ ...prev, maxEmpregadosMedia: Number(event.target.value || 0) }))}
            />
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <label className="text-xs font-medium text-slate-600">Categoria padrao</label>
          <select
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            value={form.categoriaPadraoId ?? ""}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                categoriaPadraoId: event.target.value ? Number(event.target.value) : null,
              }))
            }
          >
            <option value="">Sem categoria padrao</option>
            {categorias
              .filter((item) => item.status === "ATIVO")
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
          </select>
        </div>
      </div>

      {erro ? <p className="text-sm font-medium text-red-700">{erro}</p> : null}

      <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar configuracoes gerais"}</Button>
    </form>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
