import { prisma } from "@/lib/prisma";
import { geocodeByCep, geocodeByAddress } from "@/lib/services/geocoding";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/geocoding
 * Geocodifica UMA empresa por chamada — síncrono, sem fire-and-forget.
 * O cliente chama em loop até receber { done: true }.
 * Isso respeita o rate limit do Nominatim e funciona corretamente em Next.js.
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const proxima = await prisma.empresa.findFirst({
    where: { lat: null, endereco: { cep: { not: "" } } },
    select: {
      id: true,
      razaoSocial: true,
      endereco: { select: { cep: true, logradouro: true, bairro: true } },
    },
    orderBy: { id: "asc" },
  });

  if (!proxima || !proxima.endereco?.cep) {
    const [total, geocodificadas] = await Promise.all([
      prisma.empresa.count(),
      prisma.empresa.count({ where: { lat: { not: null } } }),
    ]);
    return NextResponse.json({ done: true, geocodificadas, total });
  }

  const { cep, logradouro, bairro } = proxima.endereco;

  let coords = await geocodeByCep(cep);
  if (!coords && (logradouro || bairro)) {
    coords = await geocodeByAddress(logradouro, bairro, "São Cristóvão");
  }

  if (coords) {
    await prisma.empresa.update({
      where: { id: proxima.id },
      data: { lat: coords.lat, lng: coords.lng },
    });
  } else {
    // Marca com coords inválidas para não tentar novamente e travar o loop
    await prisma.empresa.update({
      where: { id: proxima.id },
      data: { lat: 0, lng: 0 },
    });
  }

  const [total, geocodificadas, pendentes] = await Promise.all([
    prisma.empresa.count(),
    prisma.empresa.count({ where: { lat: { not: null } } }),
    prisma.empresa.count({ where: { lat: null, endereco: { cep: { not: "" } } } }),
  ]);

  return NextResponse.json({
    done: pendentes === 0,
    empresa: proxima.razaoSocial,
    encontrou: !!coords,
    geocodificadas,
    pendentes,
    total,
  });
}

/** GET /api/admin/geocoding — status de cobertura */
export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);
  if (auth.denied) return auth.denied;

  const [total, comCoords, semEndereco, comCoordsZero] = await Promise.all([
    prisma.empresa.count(),
    prisma.empresa.count({ where: { lat: { not: null }, NOT: { lat: 0 } } }),
    prisma.empresa.count({ where: { endereco: { is: null } } }),
    prisma.empresa.count({ where: { lat: 0, lng: 0 } }),
  ]);

  const pendentes = total - comCoords - semEndereco - comCoordsZero;

  return NextResponse.json({
    total,
    geocodificadas: comCoords,
    pendentes: Math.max(0, pendentes),
    semEndereco,
    naoEncontradas: comCoordsZero,
    percentual: total > 0 ? Math.round((comCoords / total) * 100) : 0,
  });
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
