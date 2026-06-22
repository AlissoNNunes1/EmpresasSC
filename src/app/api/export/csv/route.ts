import { findEmpresas } from "@/lib/services/empresa/query";
import {
  buildEmpresaExportCamposFiltro,
  buildEmpresaExportColumns,
  buildEmpresaExportFilename,
  buildEmpresaExportFilters,
  buildEmpresaExportRows,
  buildRelatorioExportRows,
  toCsv,
} from "@/lib/services/export";
import { runRelatorioQuery } from "@/lib/services/relatorio/query";
import { requireApiAuth } from "@/lib/session";
import { filtrosEmpresaSchema } from "@/lib/validations/empresa";
import { relatorioQuerySchema } from "@/lib/validations/relatorio";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);
  if (auth.denied) {
    return auth.denied;
  }

  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get("source") ?? "empresas";

  if (source === "relatorios") {
    const parsedRelatorio = relatorioQuerySchema.safeParse({
      groupBy: searchParams.get("groupBy") ?? undefined,
      metrica: searchParams.get("metrica") ?? undefined,
      situacao: searchParams.get("situacao") ?? undefined,
      porte: searchParams.get("porte") ?? undefined,
      categoriaId: searchParams.get("categoriaId") ?? undefined,
      segmentoId: searchParams.get("segmentoId") ?? undefined,
    });

    if (!parsedRelatorio.success) {
      return NextResponse.json({ error: "Parâmetros inválidos", details: parsedRelatorio.error.flatten() }, { status: 400 });
    }

    const rows = await runRelatorioQuery(parsedRelatorio.data);
    const csv = toCsv(buildRelatorioExportRows(rows));
    const generatedAt = new Date();

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${buildEmpresaExportFilename("Relatório", "csv", generatedAt)}`,
      },
    });
  }

  const parsedFilters = filtrosEmpresaSchema.safeParse(buildEmpresaExportFilters(searchParams));

  if (!parsedFilters.success) {
    return NextResponse.json({ error: "Filtros invalidos", details: parsedFilters.error.flatten() }, { status: 400 });
  }

  const segmentoSlug = searchParams.get("segmentoSlug") ?? undefined;
  const camposCustomFiltro = buildEmpresaExportCamposFiltro(searchParams);
  const columns = buildEmpresaExportColumns(searchParams);
  const empresas = await findEmpresas(parsedFilters.data, segmentoSlug, camposCustomFiltro);
  const generatedAt = new Date();
  const sourceLabel = "Empresas";
  const csv = toCsv(buildEmpresaExportRows(empresas, { columns }));

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${buildEmpresaExportFilename(sourceLabel, "csv", generatedAt)}`,
    },
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
