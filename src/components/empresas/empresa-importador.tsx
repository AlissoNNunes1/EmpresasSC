"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type ResultadoImportacao = {
  totalLinhas: number;
  processadas: number;
  criadas: number;
  atualizadas: number;
  ignoradas: number;
  erros: Array<{ linha: number; erro: string }>;
  conflitos: Array<{
    linha: number;
    cnpj: string;
    campos: Array<{ campo: string; valorArquivo: string; valorBanco: string }>;
  }>;
};

type ColMapping = {
  source: string;
  target: string | null;
  targetLabel: string;
  method: "exact" | "fuzzy" | "custom" | null;
  score?: number;
};

type ImportMode = "upsert" | "create_only" | "update_only";
type ImportStage =
  | "idle"
  | "mapping_load"
  | "mapping"
  | "analyzing"
  | "preview"
  | "importing"
  | "done"
  | "error";
type ConflictDecisions = Record<string, Record<string, "ARQUIVO" | "BANCO">>;

type EmpresaImportadorProps = {
  exibirEmModal?: boolean;
  segmentoSlug?: string;
};

const CAMPO_LABELS: Record<string, string> = {
  razaoSocial: "Razão Social",
  nomeFantasia: "Nome Fantasia",
  atividadePrincipal: "Atividade Principal",
  numeroEmpregados: "Nº Empregados",
  porte: "Porte",
  situacao: "Situação",
  categoria: "Categoria",
  cep: "CEP",
  bairro: "Bairro",
  logradouro: "Logradouro",
  responsavelNome: "Responsável",
  responsavelTipo: "Tipo Responsável",
  responsavelCpf: "CPF Responsável",
  responsavelContato: "Contato",
};

function labelConflict(campo: string) {
  return CAMPO_LABELS[campo] ?? campo;
}

function MethodBadge({ method, score }: { method: ColMapping["method"]; score?: number }) {
  if (!method) return <span className="text-xs text-slate-300">—</span>;
  if (method === "exact")
    return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Exato</span>;
  if (method === "fuzzy")
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Aprox. {score}%</span>;
  if (method === "custom")
    return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Personalizado</span>;
  return null;
}

export function EmpresaImportador({ exibirEmModal = false, segmentoSlug }: EmpresaImportadorProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // form
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ImportMode>("upsert");

  // state machine
  const [stage, setStage] = useState<ImportStage>("idle");
  const [colMappings, setColMappings] = useState<ColMapping[]>([]);
  const [totalLinhas, setTotalLinhas] = useState(0);
  const [dryRunResult, setDryRunResult] = useState<ResultadoImportacao | null>(null);
  const [finalResult, setFinalResult] = useState<ResultadoImportacao | null>(null);
  const [decisions, setDecisions] = useState<ConflictDecisions>({});
  const [expandedConflicts, setExpandedConflicts] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const isLoading = stage === "mapping_load" || stage === "analyzing" || stage === "importing";

  useEffect(() => {
    if (!exibirEmModal || !isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !isLoading) setIsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [exibirEmModal, isOpen, isLoading]);

  function reset() {
    setStage("idle");
    setFile(null);
    setColMappings([]);
    setTotalLinhas(0);
    setDryRunResult(null);
    setFinalResult(null);
    setDecisions({});
    setExpandedConflicts({});
    setError(null);
  }

  function openModal() { reset(); setIsOpen(true); }
  function closeModal() { if (isLoading) return; setIsOpen(false); reset(); }

  async function doRequest(dryRun: boolean, mergeDecisions?: ConflictDecisions): Promise<ResultadoImportacao | null> {
    if (!file) return null;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", mode);
    fd.append("dryRun", String(dryRun));
    if (segmentoSlug) fd.append("segmentoSlug", segmentoSlug);
    if (mergeDecisions) fd.append("mergeDecisions", JSON.stringify(mergeDecisions));
    try {
      const res = await fetch("/api/import/empresas", { method: "POST", body: fd });
      const payload = await res.json() as ResultadoImportacao | { error?: string };
      if (!res.ok || "error" in payload) {
        setError((payload as { error?: string }).error ?? "Falha ao importar empresas.");
        setStage("error");
        return null;
      }
      return payload as ResultadoImportacao;
    } catch {
      setError("Não foi possível concluir a importação.");
      setStage("error");
      return null;
    }
  }

  function initDecisions(conflitos: ResultadoImportacao["conflitos"]): ConflictDecisions {
    const d: ConflictDecisions = {};
    for (const c of conflitos) {
      d[c.cnpj] = {};
      for (const f of c.campos) d[c.cnpj][f.campo] = "ARQUIVO";
    }
    setExpandedConflicts(Object.fromEntries(conflitos.map((c) => [c.cnpj, true])));
    return d;
  }

  // Step 1 — analisar colunas (preview)
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Selecione um arquivo CSV ou XLSX."); return; }
    setError(null);
    setStage("mapping_load");
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/import/empresas/colunas", { method: "POST", body: fd });
        if (!res.ok) { setError("Falha ao analisar o arquivo."); setStage("error"); return; }
        const data = await res.json() as { colunas: ColMapping[]; totalLinhas: number };
        setColMappings(data.colunas);
        setTotalLinhas(data.totalLinhas);
        setStage("mapping");
      } catch {
        setError("Não foi possível ler o arquivo.");
        setStage("error");
      }
    });
  }

  // Step 2 — dry run
  function continuarAnalise() {
    setStage("analyzing");
    startTransition(async () => {
      const result = await doRequest(true);
      if (!result) return;
      setDryRunResult(result);
      setDecisions(initDecisions(result.conflitos));
      setStage("preview");
    });
  }

  function setDecision(cnpj: string, campo: string, value: "ARQUIVO" | "BANCO") {
    setDecisions((prev) => ({ ...prev, [cnpj]: { ...prev[cnpj], [campo]: value } }));
  }

  function setAllDecisionsFor(cnpj: string, value: "ARQUIVO" | "BANCO") {
    setDecisions((prev) => {
      const campos = dryRunResult?.conflitos.find((c) => c.cnpj === cnpj)?.campos ?? [];
      return { ...prev, [cnpj]: Object.fromEntries(campos.map((f) => [f.campo, value])) };
    });
  }

  // Step 3 — real import
  function confirmar() {
    setStage("importing");
    startTransition(async () => {
      const result = await doRequest(false, decisions);
      if (!result) return;
      setFinalResult(result);
      setStage("done");
      router.refresh();
    });
  }

  const allConflictsResolved =
    dryRunResult?.conflitos.every((c) =>
      c.campos.every((f) => decisions[c.cnpj]?.[f.campo] !== undefined)
    ) ?? true;

  const mappedCount = colMappings.filter((c) => c.target).length;
  const fuzzyCount = colMappings.filter((c) => c.method === "fuzzy").length;

  // ── Formulário inicial ────────────────────────────────────────────────────
  const formContent = (
    <form onSubmit={onSubmit} className="grid gap-4">
      <p className="text-sm text-slate-600">
        Envie um arquivo CSV, XLSX, DOCX ou PDF com dados tabulares. O sistema detecta cabeçalhos
        automaticamente e aplica criação/atualização por CNPJ.
      </p>

      <label className="grid gap-1.5 text-sm font-medium text-slate-700" htmlFor="arquivo-importacao">
        Arquivo de importação
        <input
          id="arquivo-importacao"
          type="file"
          accept=".csv,.xlsx,.xls,.ods,.docx,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          disabled={isLoading}
        />
      </label>

      <label className="grid gap-1.5 text-sm font-medium text-slate-700" htmlFor="modo-importacao">
        Modo de importação
        <select
          id="modo-importacao"
          value={mode}
          onChange={(e) => setMode(e.target.value as ImportMode)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          disabled={isLoading}
        >
          <option value="upsert">Inteligente — criar novas e atualizar existentes</option>
          <option value="create_only">Somente criar empresas novas</option>
          <option value="update_only">Somente atualizar empresas existentes</option>
        </select>
      </label>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-cta" disabled={isLoading || !file}>
          {stage === "mapping_load"
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Lendo arquivo…</>
            : <><Upload className="h-4 w-4" /> Analisar arquivo</>}
        </button>
        <p className="text-xs text-slate-400">Campos mínimos: razão social, CNPJ e categoria.</p>
      </div>
    </form>
  );

  // ── Preview de mapeamento de colunas ──────────────────────────────────────
  const mappingContent = (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span><strong>{totalLinhas}</strong> linha{totalLinhas !== 1 ? "s" : ""} de dados</span>
        <span className="text-slate-300">·</span>
        <span><strong>{mappedCount}</strong> de <strong>{colMappings.length}</strong> colunas reconhecidas</span>
        {fuzzyCount > 0 && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-amber-600"><strong>{fuzzyCount}</strong> por correspondência aproximada — verifique</span>
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        {/* Cabeçalho */}
        <div className="grid grid-cols-[1fr_1fr_100px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <span>Coluna no arquivo</span>
          <span>Mapeado para</span>
          <span>Método</span>
        </div>

        <ul className="max-h-64 divide-y divide-slate-50 overflow-y-auto">
          {colMappings.map((col, i) => (
            <li
              key={i}
              className={`grid grid-cols-[1fr_1fr_100px] items-center gap-3 px-3 py-2 text-sm ${!col.target ? "opacity-40" : ""}`}
            >
              <span className="truncate font-mono text-xs text-slate-600" title={col.source}>
                {col.source}
              </span>
              <span className={`truncate ${col.target ? "text-slate-800" : "italic text-slate-400"}`}>
                {col.targetLabel}
              </span>
              <span>
                <MethodBadge method={col.method} score={col.score} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      {!colMappings.some((c) => ["cnpj", "razaoSocial", "estabelecimento"].includes(c.target ?? "")) && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          Nenhuma coluna de CNPJ ou Razão Social foi detectada. Verifique se o arquivo tem o formato correto.
        </div>
      )}

      <p className="text-xs text-slate-400">
        Colunas &quot;Não mapeado&quot; serão ignoradas.
        {fuzzyCount > 0 && " Mapeamentos aproximados podem estar incorretos — confirme antes de importar."}
      </p>

      <div className="flex items-center gap-2 border-t border-slate-100 pt-2">
        <button type="button" className="btn-cta" onClick={continuarAnalise}>
          {stage === "analyzing"
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Analisando…</>
            : "Continuar e analisar dados"}
        </button>
        <button type="button" className="btn-secondary" onClick={reset} disabled={isLoading}>
          Trocar arquivo
        </button>
      </div>
    </div>
  );

  // ── Preview do dry run + resolução de conflitos ───────────────────────────
  const previewContent = dryRunResult && (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-[#d7deef] bg-[#f7f9ff] p-3 text-center text-sm">
        <div>
          <p className="text-xl font-bold text-emerald-600">{dryRunResult.criadas}</p>
          <p className="text-xs text-slate-500">a criar</p>
        </div>
        <div>
          <p className="text-xl font-bold text-blue-600">{dryRunResult.atualizadas}</p>
          <p className="text-xs text-slate-500">a atualizar</p>
        </div>
        <div>
          <p className="text-xl font-bold text-slate-400">{dryRunResult.ignoradas}</p>
          <p className="text-xs text-slate-500">ignoradas</p>
        </div>
      </div>

      {dryRunResult.erros.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            {dryRunResult.erros.length} linha{dryRunResult.erros.length !== 1 ? "s" : ""} com erro
          </p>
          <ul className="space-y-0.5 text-xs text-amber-800">
            {dryRunResult.erros.slice(0, 8).map((e) => (
              <li key={`${e.linha}-${e.erro}`}>Linha {e.linha}: {e.erro}</li>
            ))}
          </ul>
        </div>
      )}

      {dryRunResult.conflitos.length > 0 && (
        <div className="grid gap-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {dryRunResult.conflitos.length} empresa{dryRunResult.conflitos.length !== 1 ? "s" : ""} com conflito real — escolha o valor a manter:
          </p>
          <p className="text-xs text-slate-400">
            Conflitos onde um dos lados estava vazio foram resolvidos automaticamente.
          </p>

          {dryRunResult.conflitos.map((c) => {
            const expanded = expandedConflicts[c.cnpj] ?? true;
            return (
              <div key={c.cnpj} className="rounded-lg border border-amber-200 bg-white">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-amber-50"
                  onClick={() => setExpandedConflicts((prev) => ({ ...prev, [c.cnpj]: !prev[c.cnpj] }))}
                >
                  <span>
                    {c.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}
                    <span className="ml-2 font-normal text-slate-400">linha {c.linha} · {c.campos.length} campo{c.campos.length !== 1 ? "s" : ""}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setAllDecisionsFor(c.cnpj, "ARQUIVO"); }}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-blue-700 hover:bg-blue-50">
                      tudo do arquivo
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setAllDecisionsFor(c.cnpj, "BANCO"); }}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100">
                      tudo do banco
                    </button>
                    {expanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-amber-100 px-3 pb-3 pt-2">
                    <div className="grid gap-1.5">
                      {c.campos.map((f) => {
                        const dec = decisions[c.cnpj]?.[f.campo] ?? "ARQUIVO";
                        return (
                          <div key={f.campo} className="grid grid-cols-[110px_1fr_1fr] items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs">
                            <span className="font-medium text-slate-500">{labelConflict(f.campo)}</span>
                            <label className={`flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 ${dec === "ARQUIVO" ? "bg-blue-100 text-blue-800" : "text-slate-500 hover:bg-slate-100"}`}>
                              <input type="radio" name={`${c.cnpj}-${f.campo}`} value="ARQUIVO" checked={dec === "ARQUIVO"}
                                onChange={() => setDecision(c.cnpj, f.campo, "ARQUIVO")} className="accent-blue-600" />
                              <span className="truncate" title={f.valorArquivo || "(vazio)"}>
                                {f.valorArquivo || <em className="text-slate-400">vazio</em>}
                              </span>
                            </label>
                            <label className={`flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 ${dec === "BANCO" ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"}`}>
                              <input type="radio" name={`${c.cnpj}-${f.campo}`} value="BANCO" checked={dec === "BANCO"}
                                onChange={() => setDecision(c.cnpj, f.campo, "BANCO")} className="accent-slate-600" />
                              <span className="truncate" title={f.valorBanco || "(vazio)"}>
                                {f.valorBanco || <em className="text-slate-400">vazio</em>}
                              </span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
        <button type="button" className="btn-cta" disabled={!allConflictsResolved || stage === "importing"} onClick={confirmar}>
          {stage === "importing"
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Importando…</>
            : <><CheckCircle2 className="h-4 w-4" /> Confirmar importação</>}
        </button>
        <button type="button" className="btn-secondary" onClick={reset} disabled={stage === "importing"}>
          Cancelar
        </button>
      </div>
    </div>
  );

  // ── Resultado final ───────────────────────────────────────────────────────
  const doneContent = finalResult && (
    <div className="grid gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="h-5 w-5" /> Importação concluída
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-center text-sm">
        <div>
          <p className="text-xl font-bold text-emerald-700">{finalResult.criadas}</p>
          <p className="text-xs text-slate-500">criadas</p>
        </div>
        <div>
          <p className="text-xl font-bold text-blue-600">{finalResult.atualizadas}</p>
          <p className="text-xs text-slate-500">atualizadas</p>
        </div>
        <div>
          <p className="text-xl font-bold text-slate-400">{finalResult.ignoradas}</p>
          <p className="text-xs text-slate-500">ignoradas</p>
        </div>
      </div>
      {finalResult.erros.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4" /> {finalResult.erros.length} erro{finalResult.erros.length !== 1 ? "s" : ""}
          </p>
          <ul className="space-y-0.5 text-xs text-amber-800">
            {finalResult.erros.slice(0, 8).map((e) => (
              <li key={`${e.linha}-${e.erro}`}>Linha {e.linha}: {e.erro}</li>
            ))}
          </ul>
        </div>
      )}
      <button type="button" className="btn-secondary w-fit" onClick={reset}>
        Importar outro arquivo
      </button>
    </div>
  );

  // ── Card principal ────────────────────────────────────────────────────────
  const card = (
    <Card className="card-elevated">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base text-[#1b3383]">
          <span className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importação Inteligente
            {stage === "mapping" && (
              <span className="text-xs font-normal text-slate-400">— Passo 1 de 3: Mapeamento de colunas</span>
            )}
            {(stage === "preview" || stage === "importing") && (
              <span className="text-xs font-normal text-slate-400">— Passo 2 de 3: Revisão</span>
            )}
          </span>
          {exibirEmModal && (
            <Button type="button" variant="ghost" size="sm" onClick={closeModal} disabled={isLoading} aria-label="Fechar">
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(stage === "idle" || stage === "mapping_load" || stage === "error") && formContent}
        {(stage === "mapping" || stage === "analyzing") && mappingContent}
        {(stage === "preview" || stage === "importing") && previewContent}
        {stage === "done" && doneContent}
      </CardContent>
    </Card>
  );

  if (!exibirEmModal) return card;

  return (
    <>
      <Button type="button" variant="outline" className="h-10 px-3" onClick={openModal}
        aria-haspopup="dialog" aria-expanded={isOpen} aria-controls="modal-importacao" title="Importação inteligente">
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">Importar</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 sm:items-center"
          role="dialog" aria-modal="true" id="modal-importacao" onClick={closeModal}>
          <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            {card}
          </div>
        </div>
      )}
    </>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
