import { NextRequest, NextResponse } from "next/server";

type BrasilApiResponse = {
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

export async function GET(request: NextRequest) {
  const cnpj = request.nextUrl.searchParams.get("cnpj");
  const cnpjDigitos = cnpj?.replace(/\D/g, "");

  if (!cnpjDigitos || cnpjDigitos.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
  }

  try {
    const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpjDigitos}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://brasilapi.com.br/",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 404) {
      return NextResponse.json({ error: "CNPJ não encontrado na Receita Federal" }, { status: 404 });
    }

    if (res.status === 403) {
      console.warn(`BrasilAPI 403 para CNPJ ${cnpjDigitos} - possível rate limit`);
      return NextResponse.json(
        { error: "Limite de requisições atingido. Aguarde alguns segundos e tente novamente." },
        { status: 429 }
      );
    }

    if (!res.ok) {
      console.error(`BrasilAPI ${res.status} para CNPJ ${cnpjDigitos}`);
      return NextResponse.json(
        { error: `Erro ao consultar (${res.status}). Tente novamente em alguns instantes.` },
        { status: res.status }
      );
    }

    const data: BrasilApiResponse = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Erro ao consultar CNPJ ${cnpj}:`, error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Requisição expirou. Tente novamente." }, { status: 504 });
    }

    return NextResponse.json({ error: "Erro ao conectar com a Receita Federal. Tente novamente." }, { status: 500 });
  }
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
