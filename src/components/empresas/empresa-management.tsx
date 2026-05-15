"use client";

import { EmpresaImportador } from "@/components/empresas/empresa-importador";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseCampoOpcoes, type CampoEmpresaConfig } from "@/services/campos.service";
import type { PapelUsuario } from "@prisma/client";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CategoriaOption = {
  id: number;
  nome: string;
};

type Responsavel = {
  nome: string;
  tipo: "PROPRIETARIO" | "GERENTE" | "RH";
  cpf: string;
  contato: string;
};

type EmpresaRecord = {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  porte: "MEI" | "MICRO" | "PEQUENA" | "MEDIA" | "GRANDE";
  categoriaId: number;
  atividadePrincipal: string;
  numeroEmpregados: number;
  situacao: "ATIVA" | "INATIVA" | "SUSPENSA" | "ENCERRADA";
  categoria: { id: number; nome: string };
  endereco: { cep: string; bairro: string; logradouro: string } | null;
  responsaveis: Responsavel[];
  camposCustom: Array<{ campoId: number; valor: string; campo: { nome: string; label: string } }>;
};

type EmpresaFormState = {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  porte: "MEI" | "MICRO" | "PEQUENA" | "MEDIA" | "GRANDE";
  categoriaId: string;
  atividadePrincipal: string;
  numeroEmpregados: string;
  situacao: "ATIVA" | "INATIVA" | "SUSPENSA" | "ENCERRADA";
  endereco: { cep: string; bairro: string; logradouro: string };
  responsaveis: Responsavel[];
  camposCustom: Record<number, string>;
};

type BrasilApiCnpjResponse = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  porte: string;
  descricao_atividade_principal: Array<{ text: string; code: string }>;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  situacao_cadastral: string;
  qsa: Array<{ nome_socio: string; cnpj_cpf_do_socio: string }>;
};

type Props = {
  empresas: EmpresaRecord[];
  categorias: CategoriaOption[];
  role: PapelUsuario;
  campos: CampoEmpresaConfig[];
  exportCsvUrl?: string;
  exportXlsxUrl?: string;
  exportPdfUrl?: string;
  temFiltrosAtivos?: boolean;
};

function createEmptyForm(): EmpresaFormState {
  return {
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    porte: "MEI",
    categoriaId: "",
    atividadePrincipal: "",
    numeroEmpregados: "0",
    situacao: "ATIVA",
    endereco: { cep: "", bairro: "", logradouro: "" },
    responsaveis: [{ nome: "", tipo: "PROPRIETARIO", cpf: "", contato: "" }],
    camposCustom: {},
  };
}

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatCnpjMask(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function mapPorteBrasil(porte: unknown): EmpresaFormState["porte"] {
  const p = typeof porte === "string" ? porte.toUpperCase() : "";
  if (p === "MEI") return "MEI";
  if (p.includes("MICRO")) return "MICRO";
  if (p.includes("PEQUENO") || p.includes("PEQUENA")) return "PEQUENA";
  return "GRANDE";
}

function mapSituacaoBrasil(situacao: unknown): EmpresaFormState["situacao"] {
  const s = typeof situacao === "string" ? situacao.toUpperCase() : "";
  if (s === "ATIVA") return "ATIVA";
  if (s === "SUSPENSA") return "SUSPENSA";
  if (s === "INAPTA" || s === "BAIXADA") return "ENCERRADA";
  return "INATIVA";
}

function getSituacaoBadgeClass(situacao: EmpresaRecord["situacao"]): string {
  if (situacao === "ATIVA") return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  if (situacao === "SUSPENSA") return "border border-amber-200 bg-amber-50 text-amber-700";
  if (situacao === "ENCERRADA") return "border border-rose-200 bg-rose-50 text-rose-700";
  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function formatCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

function mergeSelectOptions(options: string[], currentValue: string): string[] {
  const normalized = options.map((option) => option.trim()).filter(Boolean);
  const unique = [...new Set(normalized)];
  const current = currentValue.trim();

  if (current && !unique.includes(current)) {
    unique.unshift(current);
  }

  return unique;
}

export function EmpresaManagement({ empresas, categorias, role, campos, exportCsvUrl, exportXlsxUrl, exportPdfUrl, temFiltrosAtivos }: Props) {
  const camposCustom = campos.filter((c) => !c.builtin);
  const campoAtividadePrincipal = campos.find((c) => c.nome === "atividadePrincipal");
  const campoEnderecoBairro = campos.find((c) => c.nome === "enderecoBairro");
  const getLabel = (nome: string, fallback: string) => campos.find((c) => c.nome === nome)?.label ?? fallback;
  const isVisivel = (nome: string) => campos.find((c) => c.nome === nome)?.visivel !== false;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EmpresaFormState>(createEmptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(12);

  // Passo 1 — consulta CNPJ
  const [cnpjInput, setCnpjInput] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [cnpjErro, setCnpjErro] = useState<string | null>(null);
  const [cnpjConsultado, setCnpjConsultado] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const canCreate = role === "ADMIN" || role === "ANALISTA";
  const canEdit = role === "ADMIN" || role === "ANALISTA";
  const canDelete = role === "ADMIN";
  const canView = true;

  const headerTitle = useMemo(() => {
    if (mode === "create") {
      if (!cnpjConsultado) return "Passo 1 — Consultar CNPJ";
      if (showPreview) return "Passo 2 — Revisar dados importados";
      return "Passo 3 — Completar cadastro";
    }
    if (mode === "edit") return `Editar empresa #${editingId ?? ""}`;
    return "";
  }, [editingId, mode, cnpjConsultado, showPreview]);

  const totalPaginas = Math.max(1, Math.ceil(empresas.length / itensPorPagina));
  const empresasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return empresas.slice(inicio, inicio + itensPorPagina);
  }, [empresas, itensPorPagina, paginaAtual]);

  useEffect(() => { setPaginaAtual(1); }, [empresas.length]);
  useEffect(() => {
    if (paginaAtual > totalPaginas) setPaginaAtual(totalPaginas);
  }, [paginaAtual, totalPaginas]);

  useEffect(() => {
    const editarParam = searchParams.get("editar");
    if (!editarParam) return;
    const id = Number(editarParam);
    if (!Number.isInteger(id) || id <= 0) return;
    if (mode === "edit" && editingId === id) return;
    const empresa = empresas.find((item) => item.id === id);
    if (!empresa) return;
    openEdit(empresa);
  }, [searchParams, empresas, mode, editingId]);

  async function consultarCnpj(cnpj: string) {
    if (cnpj.length !== 14) return;
    setConsultando(true);
    setCnpjErro(null);

    try {
      const res = await fetch(`/api/cnpj?cnpj=${cnpj}`);

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as { error?: string } | null;
        const errorMessage =
          res.status === 404
            ? errorData?.error ?? "CNPJ não encontrado na Receita Federal."
            : res.status === 429
              ? errorData?.error ?? "Muitas requisições. Aguarde alguns segundos e tente novamente."
              : errorData?.error ?? "Falha ao consultar. Verifique o CNPJ e tente novamente.";
        setCnpjErro(errorMessage);
        setConsultando(false);
        return;
      }

      let data: BrasilApiCnpjResponse;
      try {
        data = (await res.json()) as BrasilApiCnpjResponse;
        console.log("✓ Dados recebidos da API:", data);
      } catch (parseError) {
        console.error("✗ Erro ao fazer parse JSON:", parseError);
        setCnpjErro("Erro ao processar resposta. Tente novamente.");
        setConsultando(false);
        return;
      }

      try {
        const logradouro = [data.logradouro, data.numero, data.complemento]
          .filter(Boolean)
          .join(", ");

        setForm({
          razaoSocial: data.razao_social ?? "",
          nomeFantasia: data.nome_fantasia ?? "",
          cnpj,
          porte: mapPorteBrasil(data.porte ?? ""),
          categoriaId: "",
          atividadePrincipal: data.descricao_atividade_principal?.[0]?.text ?? "",
          numeroEmpregados: "0",
          situacao: mapSituacaoBrasil(data.situacao_cadastral ?? ""),
          endereco: {
            cep: (data.cep ?? "").replace(/\D/g, ""),
            bairro: data.bairro ?? "",
            logradouro,
          },
          responsaveis:
            data.qsa?.length > 0
              ? data.qsa.slice(0, 1).map((q) => ({
                  nome: q.nome_socio ?? "",
                  tipo: "PROPRIETARIO" as const,
                  cpf: (q.cnpj_cpf_do_socio ?? "").replace(/\D/g, ""),
                  contato: "",
                }))
              : [{ nome: "", tipo: "PROPRIETARIO", cpf: "", contato: "" }],
          camposCustom: {},
        });

        setCnpjConsultado(true);
        setShowPreview(true);
        console.log("✓ Formulário preenchido com sucesso");
      } catch (fillError) {
        console.error("✗ Erro ao preencher formulário:", fillError);
        setCnpjErro("Erro ao processar dados. Tente novamente.");
      } finally {
        setConsultando(false);
      }
    } catch (fetchError) {
      console.error("✗ Erro na requisição:", fetchError);
      setCnpjErro("Falha na conexão. Verifique sua internet e tente novamente.");
      setConsultando(false);
    }
  }

  function pularConsulta() {
    const digits = normalizeDigits(cnpjInput);
    setForm((prev) => ({ ...prev, cnpj: digits }));
    setCnpjConsultado(true);
    setShowPreview(false);
    setCnpjErro(null);
  }

  function handleCnpjInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCnpjMask(e.target.value);
    setCnpjInput(formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 14) {
      consultarCnpj(digits);
    }
  }

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setError(null);
    setCnpjInput("");
    setCnpjErro(null);
    setCnpjConsultado(false);
    setForm(createEmptyForm());
  }

  function openEdit(empresa: EmpresaRecord) {
    setMode("edit");
    setEditingId(empresa.id);
    setError(null);
    setCnpjConsultado(false);
    const customVals: Record<number, string> = {};
    for (const v of empresa.camposCustom ?? []) customVals[v.campoId] = v.valor;
    setForm({
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia ?? "",
      cnpj: empresa.cnpj,
      porte: empresa.porte,
      categoriaId: String(empresa.categoriaId),
      atividadePrincipal: empresa.atividadePrincipal,
      numeroEmpregados: String(empresa.numeroEmpregados),
      situacao: empresa.situacao,
      endereco: {
        cep: empresa.endereco?.cep ?? "",
        bairro: empresa.endereco?.bairro ?? "",
        logradouro: empresa.endereco?.logradouro ?? "",
      },
      responsaveis:
        empresa.responsaveis.length > 0
          ? empresa.responsaveis.map((item) => ({ nome: item.nome, tipo: item.tipo, cpf: item.cpf, contato: item.contato }))
          : [{ nome: "", tipo: "PROPRIETARIO", cpf: "", contato: "" }],
      camposCustom: customVals,
    });
  }

  function cancelForm() {
    setMode(null);
    setEditingId(null);
    setError(null);
    setCnpjInput("");
    setCnpjErro(null);
    setCnpjConsultado(false);
    setShowPreview(false);
    setForm(createEmptyForm());
  }

  function setResponsavelField(index: number, key: keyof Responsavel, value: string) {
    setForm((previous) => {
      const responsaveis = [...previous.responsaveis];
      responsaveis[index] = { ...responsaveis[index], [key]: value };
      return { ...previous, responsaveis };
    });
  }

  function addResponsavel() {
    setForm((previous) => ({
      ...previous,
      responsaveis: [...previous.responsaveis, { nome: "", tipo: "PROPRIETARIO", cpf: "", contato: "" }],
    }));
  }

  function removeResponsavel(index: number) {
    setForm((previous) => {
      if (previous.responsaveis.length === 1) return previous;
      return { ...previous, responsaveis: previous.responsaveis.filter((_, i) => i !== index) };
    });
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      razaoSocial: form.razaoSocial,
      nomeFantasia: form.nomeFantasia || undefined,
      cnpj: normalizeDigits(form.cnpj),
      porte: form.porte,
      categoriaId: Number(form.categoriaId),
      atividadePrincipal: form.atividadePrincipal,
      numeroEmpregados: Number(form.numeroEmpregados),
      situacao: form.situacao,
      endereco: {
        cep: normalizeDigits(form.endereco.cep),
        bairro: form.endereco.bairro,
        logradouro: form.endereco.logradouro,
      },
      responsaveis: form.responsaveis.map((item) => ({
        nome: item.nome,
        tipo: item.tipo,
        cpf: normalizeDigits(item.cpf),
        contato: item.contato,
      })),
      camposCustom: Object.entries(form.camposCustom)
        .filter(([, valor]) => valor?.trim())
        .map(([campoId, valor]) => ({ campoId: Number(campoId), valor: valor.trim() })),
    };

    const endpoint = mode === "edit" && editingId ? `/api/empresas/${editingId}` : "/api/empresas";
    const method = mode === "edit" ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Não foi possível salvar a empresa.");
      return;
    }

    cancelForm();
    router.refresh();
  }

  async function deleteEmpresa(id: number) {
    const ok = window.confirm("Deseja remover esta empresa? Esta ação não pode ser desfeita.");
    if (!ok) return;

    setLoading(true);
    setError(null);

    const response = await fetch(`/api/empresas/${id}`, { method: "DELETE" });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Não foi possível remover a empresa.");
      return;
    }

    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">
              Empresas
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({empresas.length} {empresas.length === 1 ? "registro" : "registros"})
              </span>
            </CardTitle>
            {temFiltrosAtivos && (
              <p className="mt-0.5 text-xs text-[#1b3383]">Filtros ativos aplicados aos resultados e exportações.</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(exportCsvUrl || exportXlsxUrl || exportPdfUrl) && (
              <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                <span className="mr-1.5 text-xs font-medium text-slate-400">Exportar:</span>
                {exportCsvUrl && (
                  <a href={exportCsvUrl} className="rounded px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-[#1b3383]">
                    CSV
                  </a>
                )}
                {exportXlsxUrl && (
                  <a href={exportXlsxUrl} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-[#1b3383]">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    XLSX
                  </a>
                )}
                {exportPdfUrl && (
                  <a href={exportPdfUrl} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-[#1b3383]">
                    <FileText className="h-3.5 w-3.5" />
                    PDF
                  </a>
                )}
              </div>
            )}
            {canCreate ? <EmpresaImportador exibirEmModal /> : null}
            {canCreate ? (
              <Button onClick={openCreate} disabled={loading} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Nova empresa
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── PASSO 1: consulta de CNPJ ── */}
        {mode === "create" && !cnpjConsultado ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1b3383]">Nova empresa · Passo 1 de 2</p>
            <h3 className="mt-0.5 text-sm font-semibold text-slate-900">Consultar CNPJ</h3>
            <p className="mt-1 text-xs text-slate-500">
              Digite o CNPJ para pré-preencher o formulário automaticamente com os dados da Receita Federal.
            </p>

            <div className="mt-4 flex max-w-sm flex-col gap-3">
              <div className="relative">
                <input
                  autoFocus
                  value={cnpjInput}
                  onChange={handleCnpjInputChange}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  disabled={consultando}
                  className={`h-11 w-full rounded-lg border px-3 font-mono text-base tracking-wider placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b3383]/30 disabled:bg-slate-100 ${
                    cnpjErro ? "border-red-300 bg-red-50" : "border-slate-300 bg-white"
                  }`}
                />
                {consultando && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                )}
              </div>

              {cnpjErro ? (
                <p className="flex items-start gap-1.5 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  {cnpjErro}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => consultarCnpj(normalizeDigits(cnpjInput))}
                  disabled={consultando || normalizeDigits(cnpjInput).length !== 14}
                  className="btn-cta disabled:opacity-50"
                >
                  {consultando ? "Consultando…" : "Consultar"}
                </button>
                <button
                  type="button"
                  onClick={pularConsulta}
                  disabled={consultando}
                  className="btn-secondary"
                >
                  Preencher manualmente
                </button>
                <button type="button" onClick={cancelForm} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── PASSO 2: revisão de dados importados ── */}
        {mode === "create" && cnpjConsultado && showPreview ? (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCnpjConsultado(false);
                  setShowPreview(false);
                  setCnpjErro(null);
                }}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#1b3383]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Alterar CNPJ
              </button>
              <h3 className="text-sm font-semibold text-slate-900">{headerTitle}</h3>
            </div>

            <p className="text-xs text-slate-600">
              Revise os dados importados da Receita Federal. Você pode editar qualquer campo antes de continuar.
            </p>

            <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-100 bg-white p-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{getLabel("razaoSocial", "Razão Social")}</label>
                <input
                  value={form.razaoSocial}
                  onChange={(e) => setForm((prev) => ({ ...prev, razaoSocial: e.target.value }))}
                  className="h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm"
                />
              </div>
              {isVisivel("nomeFantasia") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("nomeFantasia", "Nome Fantasia")}</label>
                  <input
                    value={form.nomeFantasia}
                    onChange={(e) => setForm((prev) => ({ ...prev, nomeFantasia: e.target.value }))}
                    className="h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm"
                  />
                </div>
              ) : null}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{getLabel("cnpj", "CNPJ")}</label>
                <input value={formatCnpj(form.cnpj)} readOnly className="h-9 w-full rounded-md border border-slate-300 bg-slate-100 px-2.5 font-mono text-sm" />
              </div>
              {isVisivel("porte") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("porte", "Porte")}</label>
                  <select
                    value={form.porte}
                    onChange={(e) => setForm((prev) => ({ ...prev, porte: e.target.value as EmpresaFormState["porte"] }))}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm"
                  >
                    <option value="MEI">MEI</option>
                    <option value="MICRO">Micro</option>
                    <option value="PEQUENA">Pequena</option>
                    <option value="MEDIA">Média</option>
                    <option value="GRANDE">Grande</option>
                  </select>
                </div>
              ) : null}

              {isVisivel("atividadePrincipal") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("atividadePrincipal", "Atividade Principal")}</label>
                  {campoAtividadePrincipal && parseCampoOpcoes(campoAtividadePrincipal.opcoes).length > 0 ? (
                    <select
                      className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm"
                      value={form.atividadePrincipal}
                      onChange={(e) => setForm((prev) => ({ ...prev, atividadePrincipal: e.target.value }))}
                    >
                      <option value="">Selecione a atividade principal</option>
                      {mergeSelectOptions(parseCampoOpcoes(campoAtividadePrincipal.opcoes), form.atividadePrincipal).map((opcao) => (
                        <option key={opcao} value={opcao}>{opcao}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form.atividadePrincipal}
                      onChange={(e) => setForm((prev) => ({ ...prev, atividadePrincipal: e.target.value }))}
                      className="h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm"
                    />
                  )}
                </div>
              ) : null}
              {isVisivel("situacao") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("situacao", "Situação")}</label>
                  <select
                    value={form.situacao}
                    onChange={(e) => setForm((prev) => ({ ...prev, situacao: e.target.value as EmpresaFormState["situacao"] }))}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm"
                  >
                    <option value="ATIVA">Ativa</option>
                    <option value="INATIVA">Inativa</option>
                    <option value="SUSPENSA">Suspensa</option>
                    <option value="ENCERRADA">Encerrada</option>
                  </select>
                </div>
              ) : null}

              {isVisivel("enderecoCep") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("enderecoCep", "CEP")}</label>
                  <input
                    value={form.endereco.cep}
                    onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, cep: e.target.value } }))}
                    className="h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm"
                  />
                </div>
              ) : null}
              {isVisivel("enderecoBairro") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("enderecoBairro", "Bairro/Povoado")}</label>
                  {campoEnderecoBairro && parseCampoOpcoes(campoEnderecoBairro.opcoes).length > 0 ? (
                    <select
                      className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm"
                      value={form.endereco.bairro}
                      onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, bairro: e.target.value } }))}
                    >
                      <option value="">Selecione o bairro/povoado</option>
                      {mergeSelectOptions(parseCampoOpcoes(campoEnderecoBairro.opcoes), form.endereco.bairro).map((opcao) => (
                        <option key={opcao} value={opcao}>{opcao}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form.endereco.bairro}
                      onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, bairro: e.target.value } }))}
                      className="h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm"
                    />
                  )}
                </div>
              ) : null}
              {isVisivel("enderecoLogradouro") ? (
                <div className="col-span-full space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("enderecoLogradouro", "Logradouro")}</label>
                  <input
                    value={form.endereco.logradouro}
                    onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, logradouro: e.target.value } }))}
                    className="h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm"
                  />
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="btn-cta flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Continuar para cadastro
              </button>
              <button
                type="button"
                onClick={() => {
                  setCnpjConsultado(false);
                  setShowPreview(false);
                  setCnpjErro(null);
                }}
                className="btn-secondary"
              >
                Alterar CNPJ
              </button>
              <button type="button" onClick={cancelForm} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

        {/* ── PASSO 3 / EDIÇÃO: formulário completo ── */}
        {(mode === "create" && cnpjConsultado && !showPreview) || mode === "edit" ? (
          <form onSubmit={submitForm} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              {mode === "create" ? (
                <button
                  type="button"
                  onClick={() => { setCnpjConsultado(false); setCnpjErro(null); }}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#1b3383]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Alterar CNPJ
                </button>
              ) : null}
              <h3 className="text-sm font-semibold text-slate-900">{headerTitle}</h3>
              {mode === "create" && cnpjConsultado && form.razaoSocial ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Dados importados da Receita Federal
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{getLabel("razaoSocial", "Razão Social")} *</label>
                <Input placeholder="Razão social" value={form.razaoSocial} onChange={(e) => setForm((prev) => ({ ...prev, razaoSocial: e.target.value }))} required />
              </div>
              {isVisivel("nomeFantasia") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("nomeFantasia", "Nome Fantasia")}</label>
                  <Input placeholder="Nome fantasia" value={form.nomeFantasia} onChange={(e) => setForm((prev) => ({ ...prev, nomeFantasia: e.target.value }))} />
                </div>
              ) : null}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{getLabel("cnpj", "CNPJ")} *</label>
                <Input
                  placeholder="Somente números"
                  value={mode === "create" ? formatCnpj(form.cnpj) : form.cnpj}
                  onChange={(e) => setForm((prev) => ({ ...prev, cnpj: e.target.value }))}
                  readOnly={mode === "create" && cnpjConsultado}
                  className={mode === "create" && cnpjConsultado ? "bg-slate-100 font-mono" : ""}
                  required
                />
              </div>

              {isVisivel("porte") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("porte", "Porte")} *</label>
                  <select className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={form.porte} onChange={(e) => setForm((prev) => ({ ...prev, porte: e.target.value as EmpresaFormState["porte"] }))}>
                    <option value="MEI">MEI</option>
                    <option value="MICRO">Micro</option>
                    <option value="PEQUENA">Pequena</option>
                    <option value="MEDIA">Média</option>
                    <option value="GRANDE">Grande</option>
                  </select>
                </div>
              ) : null}

              {isVisivel("categoriaId") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("categoriaId", "Categoria")} *</label>
                  <select className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={form.categoriaId} onChange={(e) => setForm((prev) => ({ ...prev, categoriaId: e.target.value }))} required>
                    <option value="">Selecione a categoria</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              {isVisivel("atividadePrincipal") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("atividadePrincipal", "Atividade Principal")} *</label>
                  {campoAtividadePrincipal && parseCampoOpcoes(campoAtividadePrincipal.opcoes).length > 0 ? (
                    <select
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                      value={form.atividadePrincipal}
                      onChange={(e) => setForm((prev) => ({ ...prev, atividadePrincipal: e.target.value }))}
                      required
                    >
                      <option value="">Selecione a atividade principal</option>
                      {mergeSelectOptions(parseCampoOpcoes(campoAtividadePrincipal.opcoes), form.atividadePrincipal).map((opcao) => (
                        <option key={opcao} value={opcao}>
                          {opcao}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input placeholder="Atividade principal" value={form.atividadePrincipal} onChange={(e) => setForm((prev) => ({ ...prev, atividadePrincipal: e.target.value }))} required />
                  )}
                </div>
              ) : null}

              {isVisivel("numeroEmpregados") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("numeroEmpregados", "Nº de Empregados")} *</label>
                  <Input type="number" min={0} placeholder="Número de empregados" value={form.numeroEmpregados} onChange={(e) => setForm((prev) => ({ ...prev, numeroEmpregados: e.target.value }))} required />
                </div>
              ) : null}

              {isVisivel("situacao") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("situacao", "Situação")} *</label>
                  <select className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={form.situacao} onChange={(e) => setForm((prev) => ({ ...prev, situacao: e.target.value as EmpresaFormState["situacao"] }))}>
                    <option value="ATIVA">Ativa</option>
                    <option value="INATIVA">Inativa</option>
                    <option value="SUSPENSA">Suspensa</option>
                    <option value="ENCERRADA">Encerrada</option>
                  </select>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {isVisivel("enderecoCep") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("enderecoCep", "CEP")} *</label>
                  <Input placeholder="CEP" value={form.endereco.cep} onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, cep: e.target.value } }))} required />
                </div>
              ) : null}
              {isVisivel("enderecoBairro") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("enderecoBairro", "Bairro/Povoado")} *</label>
                  {campoEnderecoBairro && parseCampoOpcoes(campoEnderecoBairro.opcoes).length > 0 ? (
                    <select
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                      value={form.endereco.bairro}
                      onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, bairro: e.target.value } }))}
                      required
                    >
                      <option value="">Selecione o bairro/povoado</option>
                      {mergeSelectOptions(parseCampoOpcoes(campoEnderecoBairro.opcoes), form.endereco.bairro).map((opcao) => (
                        <option key={opcao} value={opcao}>
                          {opcao}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input placeholder="Bairro/Povoado" value={form.endereco.bairro} onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, bairro: e.target.value } }))} required />
                  )}
                </div>
              ) : null}
              {isVisivel("enderecoLogradouro") ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{getLabel("enderecoLogradouro", "Logradouro")} *</label>
                  <Input placeholder="Logradouro" value={form.endereco.logradouro} onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, logradouro: e.target.value } }))} required />
                </div>
              ) : null}
            </div>

            {camposCustom.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {camposCustom.map((campo) => (
                  <div key={campo.id} className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      {campo.label}
                      {campo.obrigatorio ? " *" : ""}
                    </label>
                    {campo.tipo === "TEXTAREA" ? (
                      <textarea
                        value={form.camposCustom[campo.id] ?? ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, camposCustom: { ...prev.camposCustom, [campo.id]: e.target.value } }))}
                        required={campo.obrigatorio}
                        rows={3}
                        className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
                      />
                    ) : campo.tipo === "SELECT" && parseCampoOpcoes(campo.opcoes).length > 0 ? (
                      <select
                        value={form.camposCustom[campo.id] ?? ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, camposCustom: { ...prev.camposCustom, [campo.id]: e.target.value } }))}
                        required={campo.obrigatorio}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm"
                      >
                        <option value="">Selecione…</option>
                        {mergeSelectOptions(parseCampoOpcoes(campo.opcoes), form.camposCustom[campo.id] ?? "").map((op) => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type={campo.tipo === "NUMERO" ? "number" : campo.tipo === "DATA" ? "date" : "text"}
                        value={form.camposCustom[campo.id] ?? ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, camposCustom: { ...prev.camposCustom, [campo.id]: e.target.value } }))}
                        required={campo.obrigatorio}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">Responsáveis</h4>
                <Button type="button" variant="outline" size="sm" onClick={addResponsavel}>
                  Adicionar responsável
                </Button>
              </div>

              {form.responsaveis.map((responsavel, index) => (
                <div key={`${index}-${responsavel.cpf}`} className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Input placeholder="Nome" value={responsavel.nome} onChange={(e) => setResponsavelField(index, "nome", e.target.value)} required />
                  <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={responsavel.tipo} onChange={(e) => setResponsavelField(index, "tipo", e.target.value)}>
                    <option value="PROPRIETARIO">Proprietário</option>
                    <option value="GERENTE">Gerente</option>
                    <option value="RH">RH</option>
                  </select>
                  <Input placeholder="CPF" value={responsavel.cpf} onChange={(e) => setResponsavelField(index, "cpf", e.target.value)} required />
                  <Input placeholder="Contato" value={responsavel.contato} onChange={(e) => setResponsavelField(index, "contato", e.target.value)} required />
                  <Button type="button" variant="danger" size="sm" onClick={() => removeResponsavel(index)} disabled={form.responsaveis.length === 1}>
                    Remover
                  </Button>
                </div>
              ))}
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando…" : mode === "edit" ? "Salvar alterações" : "Cadastrar empresa"}
              </Button>
              <Button type="button" variant="outline" onClick={cancelForm}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-12 text-slate-400">ID</TableHead>
                <TableHead>Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead>Porte</TableHead>
                <TableHead className="text-right">Empregados</TableHead>
                <TableHead>Situação</TableHead>
                {canView ? <TableHead className="text-right">Ações</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr:nth-child(even)]:bg-slate-50/50">
              {empresas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canView ? 9 : 8} className="py-12 text-center">
                    <p className="text-sm font-semibold text-slate-600">Nenhuma empresa encontrada</p>
                    <p className="mt-1 text-xs text-slate-400">Ajuste os filtros ou cadastre uma nova empresa.</p>
                  </TableCell>
                </TableRow>
              ) : (
                empresasPaginadas.map((empresa) => (
                  <TableRow key={empresa.id} className="transition-colors hover:bg-blue-50/30">
                    <TableCell className="text-xs tabular-nums text-slate-400">{empresa.id}</TableCell>
                    <TableCell className="max-w-[280px] py-3">
                      <span className="block truncate font-medium text-slate-900" title={empresa.razaoSocial}>{empresa.razaoSocial}</span>
                      {empresa.nomeFantasia && (
                        <span className="block truncate text-xs text-slate-400" title={empresa.nomeFantasia}>{empresa.nomeFantasia}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm tabular-nums text-slate-600">{formatCnpj(empresa.cnpj)}</TableCell>
                    <TableCell className="max-w-[180px]">
                      <span className="block truncate text-sm text-slate-700" title={empresa.categoria.nome}>{empresa.categoria.nome}</span>
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      <span className="block truncate text-sm text-slate-600" title={empresa.endereco?.bairro ?? "-"}>{empresa.endereco?.bairro ?? "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{empresa.porte}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-slate-700">{empresa.numeroEmpregados}</TableCell>
                    <TableCell>
                      <Badge className={getSituacaoBadgeClass(empresa.situacao)}>{empresa.situacao}</Badge>
                    </TableCell>
                    {canView ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/empresas/${empresa.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#1b3383]"
                            aria-label={`Visualizar empresa ${empresa.razaoSocial}`}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {canEdit ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(empresa)}
                              disabled={loading}
                              className="h-8 w-8 px-0 text-slate-600 hover:bg-blue-50 hover:text-[#1b3383]"
                              aria-label={`Editar empresa ${empresa.razaoSocial}`}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEmpresa(empresa.id)}
                              disabled={loading}
                              className="h-8 w-8 px-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                              aria-label={`Excluir empresa ${empresa.razaoSocial}`}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          totalItens={empresas.length}
          itensPorPagina={itensPorPagina}
          onMudarItensPorPagina={(itens) => { setItensPorPagina(itens); setPaginaAtual(1); }}
          onMudarPagina={setPaginaAtual}
        />
      </CardContent>
    </Card>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
