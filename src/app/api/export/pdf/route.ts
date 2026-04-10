import { NextRequest, NextResponse } from "next/server";
import { PapelUsuario } from "@prisma/client";
import { requireApiAuth } from "@/lib/session";
import { filtrosEmpresaSchema } from "@/lib/validations/empresa";
import { findEmpresas } from "@/lib/services/empresa/query";
import { toPdfBuffer } from "@/lib/services/export";

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
  const pdfBytes = await toPdfBuffer(
    empresas.map((empresa) => ({
      razaoSocial: empresa.razaoSocial,
      cnpj: empresa.cnpj,
      bairro: empresa.endereco?.bairro,
      numeroEmpregados: empresa.numeroEmpregados,
    }))
  );

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=empresas.pdf",
    },
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
