import { prisma } from "@/lib/prisma";
import { geocodeEmpresa } from "@/lib/services/geocoding";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/geocoding
 * Geocodifica em lote todas as empresas sem coordenadas que tenham CEP.
 * Respeita o rate limit do Nominatim (1 req/s) com delay entre chamadas.
 * ADMIN only.
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const semCoords = await prisma.empresa.findMany({
    where: { lat: null, endereco: { cep: { not: "" } } },
    select: { id: true, endereco: { select: { cep: true, logradouro: true, bairro: true } } },
    take: 100, // limita para evitar timeout
  });

  if (semCoords.length === 0) {
    return NextResponse.json({ message: "Todas as empresas com CEP já foram geocodificadas.", total: 0 });
  }

  // Processa em background — responde imediatamente com o total
  (async () => {
    for (const emp of semCoords) {
      if (!emp.endereco?.cep) continue;
      await geocodeEmpresa({
        empresaId: emp.id,
        cep: emp.endereco.cep,
        logradouro: emp.endereco.logradouro,
        bairro: emp.endereco.bairro,
      });
      // Nominatim: max 1 req/s
      await new Promise((r) => setTimeout(r, 1100));
    }
  })();

  return NextResponse.json({
    message: `Geocodificação em lote iniciada para ${semCoords.length} empresa(s). Pode levar alguns minutos.`,
    total: semCoords.length,
  });
}

/** GET /api/admin/geocoding — status: quantas empresas já foram geocodificadas */
export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);
  if (auth.denied) return auth.denied;

  const [total, comCoords, semCep] = await Promise.all([
    prisma.empresa.count(),
    prisma.empresa.count({ where: { lat: { not: null } } }),
    prisma.empresa.count({ where: { endereco: { is: null } } }),
  ]);

  return NextResponse.json({
    total,
    geocodificadas: comCoords,
    pendentes: total - comCoords - semCep,
    semEndereco: semCep,
    percentual: total > 0 ? Math.round((comCoords / total) * 100) : 0,
  });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
