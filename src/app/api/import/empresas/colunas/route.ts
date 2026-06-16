import { prisma } from "@/lib/prisma";
import { detectColumnMappings } from "@/lib/services/empresa/import";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);
  if (auth.denied) return auth.denied;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não informado" }, { status: 400 });
  }

  const camposCustom = await prisma.campoEmpresa.findMany({
    where: { builtin: false, visivel: true },
    select: { id: true, nome: true, label: true, tipo: true },
    orderBy: { ordem: "asc" },
  });

  const buffer = await file.arrayBuffer();
  const resultado = await detectColumnMappings(buffer, camposCustom, { fileName: file.name, mimeType: file.type });

  return NextResponse.json(resultado);
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
