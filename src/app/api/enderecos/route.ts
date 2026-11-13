import { criarBuscadoresDeEnderecos } from "@/lib/services/endereco/consulta";
import { normalizarCep } from "@/lib/services/endereco/regras";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// GET ?cep=... → endereço do CEP
// GET ?logradouro=...&bairro=... → CEP da via no município padrão (só quando não é ambíguo)
export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);
  if (auth.denied) return auth.denied;

  const params = request.nextUrl.searchParams;
  const buscadores = criarBuscadoresDeEnderecos();

  const cepParam = params.get("cep");
  if (cepParam !== null) {
    const cep = normalizarCep(cepParam);
    if (!cep) return NextResponse.json({ error: "CEP inválido" }, { status: 400 });

    const endereco = await buscadores.porCep(cep);
    return endereco ? NextResponse.json(endereco) : NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
  }

  const logradouro = params.get("logradouro")?.trim() ?? "";
  if (!logradouro) return NextResponse.json({ error: "Informe o CEP ou o logradouro" }, { status: 400 });

  const endereco = await buscadores.porLogradouro({ logradouro, bairro: params.get("bairro") ?? "" });
  return endereco
    ? NextResponse.json(endereco)
    : NextResponse.json({ error: "Logradouro não encontrado ou ambíguo" }, { status: 404 });
}
