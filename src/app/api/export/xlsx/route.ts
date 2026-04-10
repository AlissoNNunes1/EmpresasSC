import { NextRequest, NextResponse } from "next/server";
import { PapelUsuario } from "@prisma/client";
import { requireApiAuth } from "@/lib/session";
import { filtrosEmpresaSchema } from "@/lib/validations/empresa";
import { findEmpresas } from "@/lib/services/empresa/query";
import { toXlsxBuffer } from "@/lib/services/export";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);
  if (auth.denied) {
    return auth.denied;
  }

  const parsedFilters = filtrosEmpresaSchema.safeParse({
    categoriaId: request.nextUrl.searchParams.get("categoriaId") ?? undefined,
    bairro: request.nextUrl.searchParams.get("bairro") ?? undefined,
    porte: request.nextUrl.searchParams.get("porte") ?? undefined,
    situacao: request.nextUrl.searchParams.get("situacao") ?? undefined,
    minEmpregados: request.nextUrl.searchParams.get("minEmpregados") ?? undefined,
    maxEmpregados: request.nextUrl.searchParams.get("maxEmpregados") ?? undefined,
    termo: request.nextUrl.searchParams.get("termo") ?? undefined,
  });

  if (!parsedFilters.success) {
    return NextResponse.json({ error: "Filtros invalidos", details: parsedFilters.error.flatten() }, { status: 400 });
  }

  const empresas = await findEmpresas(parsedFilters.data);
  const workbookBuffer = toXlsxBuffer(
    empresas.map((empresa) => ({
      id: empresa.id,
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia,
      cnpj: empresa.cnpj,
      porte: empresa.porte,
      categoria: empresa.categoria.nome,
      bairro: empresa.endereco?.bairro,
      atividadePrincipal: empresa.atividadePrincipal,
      numeroEmpregados: empresa.numeroEmpregados,
      situacao: empresa.situacao,
    }))
  );

  const normalizedBuffer = new Uint8Array(workbookBuffer.byteLength);
  normalizedBuffer.set(workbookBuffer);

  const payload = new Blob([normalizedBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return new NextResponse(payload, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=empresas.xlsx",
    },
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
