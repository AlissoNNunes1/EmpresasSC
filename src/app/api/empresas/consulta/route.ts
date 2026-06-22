import { findEmpresas } from "@/lib/services/empresa/query";
import { buildEmpresaExportCamposFiltro, buildEmpresaExportColumns, buildEmpresaExportFilters, buildEmpresaExportRows } from "@/lib/services/export";
import { requireApiAuth } from "@/lib/session";
import { filtrosEmpresaSchema } from "@/lib/validations/empresa";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// Endpoint de pré-visualização para a consulta avançada de empresas: aplica os mesmos
// filtros e a mesma seleção de colunas usados pela exportação (CSV/XLSX/PDF), mas
// retorna JSON limitado a uma amostra de linhas para renderizar a tabela na tela.
const PREVIEW_LIMIT = 200;

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);
  if (auth.denied) {
    return auth.denied;
  }

  const searchParams = request.nextUrl.searchParams;
  const parsedFilters = filtrosEmpresaSchema.safeParse(buildEmpresaExportFilters(searchParams));

  if (!parsedFilters.success) {
    return NextResponse.json({ error: "Filtros inválidos", details: parsedFilters.error.flatten() }, { status: 400 });
  }

  const segmentoSlug = searchParams.get("segmentoSlug") ?? undefined;
  const camposCustomFiltro = buildEmpresaExportCamposFiltro(searchParams);
  const columns = buildEmpresaExportColumns(searchParams);

  const empresas = await findEmpresas(parsedFilters.data, segmentoSlug, camposCustomFiltro);
  const rows = buildEmpresaExportRows(empresas, { columns });

  return NextResponse.json({
    total: rows.length,
    columns: rows.length > 0 ? Object.keys(rows[0]) : columns ?? [],
    rows: rows.slice(0, PREVIEW_LIMIT),
  });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
