import { prisma } from "@/lib/prisma";
import { geocodeEmpresa } from "@/lib/services/geocoding";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** POST /api/empresas/[id]/geocode — força re-geocodificação de uma empresa */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);
  if (auth.denied) return auth.denied;

  const id = Number((await params).id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: { endereco: true },
  });

  if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  if (!empresa.endereco?.cep) {
    return NextResponse.json({ error: "Empresa sem CEP cadastrado" }, { status: 422 });
  }

  // Fire-and-forget — responde imediatamente, geocoding acontece em background
  geocodeEmpresa({
    empresaId: id,
    cep: empresa.endereco.cep,
    logradouro: empresa.endereco.logradouro,
    bairro: empresa.endereco.bairro,
  });

  return NextResponse.json({ message: "Geocodificação iniciada em background" });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
