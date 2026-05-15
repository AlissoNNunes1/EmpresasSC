import { NextRequest, NextResponse } from "next/server";
import { PapelUsuario } from "@prisma/client";
import { requireApiAuth } from "@/lib/session";
import { filtrosEmpresaSchema } from "@/lib/validations/empresa";
import { findEmpresas } from "@/lib/services/empresa/query";
import { buildEmpresaExportContext, buildEmpresaExportFilename, buildEmpresaExportFilters, buildEmpresaExportRows, toXlsxBuffer } from "@/lib/services/export";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.VISUALIZADOR);
  if (auth.denied) {
    return auth.denied;
  }

  const parsedFilters = filtrosEmpresaSchema.safeParse(buildEmpresaExportFilters(request.nextUrl.searchParams));

  if (!parsedFilters.success) {
    return NextResponse.json({ error: "Filtros invalidos", details: parsedFilters.error.flatten() }, { status: 400 });
  }

  const empresas = await findEmpresas(parsedFilters.data);
  const generatedAt = new Date();
  const sourceLabel = request.nextUrl.searchParams.get("source") === "relatorios" ? "Relatórios" : "Empresas";
  const payload = Buffer.from(
    toXlsxBuffer(
      buildEmpresaExportRows(empresas),
      buildEmpresaExportContext({
        sourceLabel,
        totalRecords: empresas.length,
        filters: parsedFilters.data,
        generatedAt,
      })
    )
  );

  return new NextResponse(payload, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${buildEmpresaExportFilename(sourceLabel, "xlsx", generatedAt)}`,
    },
  });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
