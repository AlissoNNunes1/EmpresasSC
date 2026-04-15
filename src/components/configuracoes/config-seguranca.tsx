"use client";

import { Button } from "@/components/ui/button";
import type { ConfiguracaoPayload, ConfiguracaoSistema } from "@/services/configuracoes.service";
import { useState } from "react";

type Props = {
  config: ConfiguracaoSistema;
  onSave: (payload: ConfiguracaoPayload) => Promise<void>;
  loading: boolean;
};

export function ConfigSeguranca({ config, onSave, loading }: Props) {
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

    try {
      await onSave(form);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao salvar configurações de segurança.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Minimo de caracteres da senha</label>
          <input
            type="number"
            min={6}
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            value={form.politicaSenhaMinCaracteres}
            onChange={(event) => setForm((prev) => ({ ...prev, politicaSenhaMinCaracteres: Number(event.target.value || 8) }))}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Tempo de sessao (minutos)</label>
          <input
            type="number"
            min={15}
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            value={form.tempoSessaoMinutos}
            onChange={(event) => setForm((prev) => ({ ...prev, tempoSessaoMinutos: Number(event.target.value || 480) }))}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h4 className="text-sm font-semibold text-slate-900">Controle de login e integracoes</h4>
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.controleLoginAtivo}
              onChange={(event) => setForm((prev) => ({ ...prev, controleLoginAtivo: event.target.checked }))}
            />
            Ativar controle de login reforcado
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.integracaoCnpjAtiva}
              onChange={(event) => setForm((prev) => ({ ...prev, integracaoCnpjAtiva: event.target.checked }))}
            />
            Habilitar integracao externa de consulta CNPJ
          </label>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Webhook URL</label>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              placeholder="https://..."
              value={form.webhookUrl ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, webhookUrl: event.target.value || null }))}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <h4 className="text-sm font-semibold text-slate-900">Backup e exportacao</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/api/export/csv" className="btn-secondary">Exportar CSV</a>
          <a href="/api/export/xlsx" className="btn-secondary">Exportar XLSX</a>
          <a href="/api/export/pdf" className="btn-secondary">Exportar PDF</a>
        </div>
      </div>

      {erro ? <p className="text-sm font-medium text-red-700">{erro}</p> : null}

      <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar segurança e integrações"}</Button>
    </form>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
