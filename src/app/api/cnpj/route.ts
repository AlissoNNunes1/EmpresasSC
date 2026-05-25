import { NextRequest, NextResponse } from "next/server";

export type CnpjApiResponse = {
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

// ── Providers em ordem de prioridade ─────────────────────────────────────────

async function fetchBrasilApi(cnpj: string): Promise<CnpjApiResponse | null> {
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 429 || res.status === 403 || res.status === 503) return null;
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) return null;
  return res.json();
}

async function fetchCnpjWs(cnpj: string): Promise<CnpjApiResponse | null> {
  const res = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 429 || res.status === 503) return null;
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) return null;

  // publica.cnpj.ws tem formato diferente — normaliza para o padrão BrasilAPI
  const d = await res.json();
  return {
    cnpj: d.cnpj ?? cnpj,
    razao_social: d.razao_social ?? "",
    nome_fantasia: d.nome_fantasia ?? "",
    porte: d.porte?.descricao ?? d.porte ?? "",
    descricao_atividade_principal: d.cnae_fiscal_descricao
      ? [{ code: String(d.cnae_fiscal ?? ""), text: d.cnae_fiscal_descricao }]
      : (d.descricao_atividade_principal ?? []),
    cep: d.cep ?? "",
    logradouro: d.logradouro ?? d.descricao_logradouro ?? "",
    numero: d.numero ?? "",
    complemento: d.complemento ?? "",
    bairro: d.bairro ?? "",
    municipio: d.municipio ?? d.descricao_municipio ?? "",
    situacao_cadastral: d.descricao_situacao_cadastral ?? d.situacao_cadastral ?? "",
    qsa: (d.qsa ?? []).map((q: Record<string, unknown>) => ({
      nome_socio: String(q.nome_socio ?? q.nome ?? ""),
      cnpj_cpf_do_socio: String(q.cnpj_cpf_do_socio ?? q.cpf_representante_legal ?? ""),
    })),
  };
}

async function fetchReceitaWs(cnpj: string): Promise<CnpjApiResponse | null> {
  const res = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 429 || res.status === 503) return null;
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) return null;

  const d = await res.json();
  if (d.status === "ERROR") {
    if (/não encontrado/i.test(d.message ?? "")) throw new Error("NOT_FOUND");
    return null;
  }

  return {
    cnpj: d.cnpj ?? cnpj,
    razao_social: d.nome ?? "",
    nome_fantasia: d.fantasia ?? "",
    porte: d.porte ?? "",
    descricao_atividade_principal: d.atividade_principal?.length
      ? [{ code: d.atividade_principal[0].code, text: d.atividade_principal[0].text }]
      : [],
    cep: (d.cep ?? "").replace(/\D/g, ""),
    logradouro: d.logradouro ?? "",
    numero: d.numero ?? "",
    complemento: d.complemento ?? "",
    bairro: d.bairro ?? "",
    municipio: d.municipio ?? "",
    situacao_cadastral: d.situacao ?? "",
    qsa: (d.qsa ?? []).map((q: Record<string, unknown>) => ({
      nome_socio: String(q.nome ?? ""),
      cnpj_cpf_do_socio: String(q.qual ?? ""),
    })),
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const cnpj = request.nextUrl.searchParams.get("cnpj");
  const cnpjDigitos = cnpj?.replace(/\D/g, "");

  if (!cnpjDigitos || cnpjDigitos.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
  }

  const providers = [
    { name: "BrasilAPI", fn: fetchBrasilApi },
    { name: "cnpj.ws", fn: fetchCnpjWs },
    { name: "ReceitaWS", fn: fetchReceitaWs },
  ];

  for (const { name, fn } of providers) {
    try {
      const data = await fn(cnpjDigitos);
      if (data) {
        return NextResponse.json(data);
      }
      console.warn(`[CNPJ] ${name} indisponível para ${cnpjDigitos}, tentando próximo provider`);
    } catch (err) {
      if (err instanceof Error && err.message === "NOT_FOUND") {
        return NextResponse.json({ error: "CNPJ não encontrado na Receita Federal" }, { status: 404 });
      }
      if (err instanceof Error && err.name === "AbortError") {
        console.warn(`[CNPJ] ${name} timeout para ${cnpjDigitos}`);
        continue;
      }
      console.error(`[CNPJ] ${name} erro para ${cnpjDigitos}:`, err);
    }
  }

  return NextResponse.json(
    { error: "Serviço de consulta de CNPJ temporariamente indisponível. Preencha os dados manualmente." },
    { status: 503 }
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
