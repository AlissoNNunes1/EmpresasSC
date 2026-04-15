"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ResultadoImportacao = {
  totalLinhas: number;
  processadas: number;
  criadas: number;
  atualizadas: number;
  ignoradas: number;
  erros: Array<{ linha: number; erro: string }>;
};

type ImportMode = "upsert" | "create_only" | "update_only";

export function EmpresaImportador() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ImportMode>("upsert");
  const [dryRun, setDryRun] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultadoImportacao | null>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setError("Selecione um arquivo CSV ou XLSX para continuar.");
      return;
    }

    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    formData.append("dryRun", String(dryRun));

    startTransition(async () => {
      try {
        const response = await fetch("/api/import/empresas", {
          method: "POST",
          body: formData,
        });

        const payload = (await response.json()) as ResultadoImportacao | { error?: string };

        if (!response.ok || "error" in payload) {
          setResult(null);
          setError((payload as { error?: string }).error ?? "Falha ao importar empresas.");
          return;
        }

        setResult(payload as ResultadoImportacao);

        if (!dryRun) {
          router.refresh();
        }
      } catch {
        setResult(null);
        setError("Não foi possível concluir a importação agora.");
      }
    });
  };

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-[#1b3383]">
          <Upload className="h-4 w-4" />
          Importação Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <p className="text-sm text-slate-700">
            Envie um arquivo CSV ou XLSX com colunas flexíveis. O sistema detecta cabeçalhos,
            valida linha a linha e aplica criação/atualização por CNPJ.
          </p>

          <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="arquivo-importacao-empresas">
            Arquivo de importação
            <input
              id="arquivo-importacao-empresas"
              type="file"
              accept=".csv,.xlsx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="modo-importacao-empresas">
              Modo de importação
              <select
                id="modo-importacao-empresas"
                value={mode}
                onChange={(event) => setMode(event.target.value as ImportMode)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="upsert">Inteligente (criar e atualizar)</option>
                <option value="create_only">Somente novas empresas</option>
                <option value="update_only">Somente empresas existentes</option>
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(event) => setDryRun(event.target.checked)}
                className="h-4 w-4 rounded border-slate-400"
              />
              Rodar em modo de simulação (sem gravar no banco)
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="btn-cta" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {dryRun ? "Validar Arquivo" : "Importar Empresas"}
            </button>
            <p className="text-xs text-slate-500">Campos mínimos: razão social, CNPJ e categoria.</p>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          {result ? (
            <section className="grid gap-3 rounded-lg border border-[#d7deef] bg-[#f7f9ff] p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1b3383]">
                <CheckCircle2 className="h-4 w-4" />
                Resultado da importação
              </div>
              <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                <p>Total de linhas: {result.totalLinhas}</p>
                <p>Processadas: {result.processadas}</p>
                <p>Ignoradas: {result.ignoradas}</p>
                <p>Criadas: {result.criadas}</p>
                <p>Atualizadas: {result.atualizadas}</p>
                <p>Erros: {result.erros.length}</p>
              </div>

              {result.erros.length > 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <AlertTriangle className="h-4 w-4" />
                    Linhas com falha (máximo 8 exibidas)
                  </p>
                  <ul className="grid gap-1 text-xs text-amber-900">
                    {result.erros.slice(0, 8).map((item) => (
                      <li key={`${item.linha}-${item.erro}`}>Linha {item.linha}: {item.erro}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
