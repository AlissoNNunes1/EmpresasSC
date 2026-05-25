/**
 * Geocoding via ViaCEP + Nominatim (OpenStreetMap).
 * Gratuito, sem API key. Política do Nominatim: max 1 req/s, User-Agent obrigatório.
 * Chamadas devem ser não-bloqueantes (fire-and-forget após salvar empresa).
 */

const NOMINATIM_UA = "EmpresasSC/1.0 (plataforma-municipal; contato@fumctur.gov.br)";

type Coords = { lat: number; lng: number };

/** Busca endereço pelo CEP via ViaCEP e devolve string de busca enriquecida */
async function resolveAddressString(cep: string): Promise<string> {
  const clean = cep.replace(/\D/g, "").padStart(8, "0");
  if (clean.length !== 8) return `${clean}, Brasil`;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": NOMINATIM_UA },
    });
    if (res.ok) {
      const data = await res.json() as Record<string, string>;
      if (!data.erro) {
        const parts = [data.logradouro, data.bairro, data.localidade, data.uf, "Brasil"].filter(Boolean);
        if (parts.length >= 2) return parts.join(", ");
      }
    }
  } catch {
    // Fallback: usa só o CEP
  }
  return `${clean}, Brasil`;
}

/** Geocodifica via Nominatim com a string de endereço */
async function nominatimSearch(query: string): Promise<Coords | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": NOMINATIM_UA,
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });

    if (!res.ok) return null;
    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!results.length) return null;

    return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
  } catch {
    return null;
  }
}

/**
 * Tenta geocodificar a empresa via CEP + ViaCEP + Nominatim.
 * Retorna null se não encontrar.
 */
export async function geocodeByCep(cep: string): Promise<Coords | null> {
  if (!cep || cep.replace(/\D/g, "").length < 5) return null;
  const addressQuery = await resolveAddressString(cep);
  return nominatimSearch(addressQuery);
}

/**
 * Geocodifica via endereço livre (logradouro + bairro + município).
 * Útil como fallback quando o CEP não produz resultado.
 */
export async function geocodeByAddress(logradouro: string, bairro: string, municipio: string): Promise<Coords | null> {
  const parts = [logradouro, bairro, municipio, "SC", "Brasil"].filter(Boolean);
  return nominatimSearch(parts.join(", "));
}

/**
 * Tenta geocodificar em dois estágios:
 *  1. Pelo CEP (mais preciso)
 *  2. Pelo endereço completo (fallback)
 * Fire-and-forget: use sem await para não bloquear o save.
 */
export async function geocodeEmpresa(params: {
  empresaId: number;
  cep: string;
  logradouro: string;
  bairro: string;
  municipio?: string;
}): Promise<void> {
  const { empresaId, cep, logradouro, bairro, municipio = "São Cristóvão" } = params;

  try {
    let coords = await geocodeByCep(cep);

    if (!coords && (logradouro || bairro)) {
      coords = await geocodeByAddress(logradouro, bairro, municipio);
    }

    if (coords) {
      const { prisma } = await import("@/lib/prisma");
      await prisma.empresa.update({
        where: { id: empresaId },
        data: { lat: coords.lat, lng: coords.lng },
      });
    }
  } catch {
    // Geocoding silenciosamente falhou — empresa fica sem coordenadas
  }
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
