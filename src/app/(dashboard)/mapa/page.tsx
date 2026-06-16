import { GeocodingPanel } from "@/components/mapa/geocoding-panel";
import MapaContainer from "@/components/mapa/mapa-container";
import type { AreaOverlay, EmpresaPin } from "@/components/mapa/mapa-interativo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Map, MapPin } from "lucide-react";
import { getServerSession } from "next-auth";

export default async function MapaPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const [empresasRaw, areasRaw, segmentos] = await Promise.all([
    // Somente empresas geocodificadas (lat/lng não nulos)
    prisma.empresa.findMany({
      where: { lat: { not: null }, lng: { not: null } },
      select: {
        id: true, razaoSocial: true, porte: true, situacao: true,
        lat: true, lng: true,
        endereco: { select: { bairro: true } },
        segmento: { select: { nome: true, cor: true } },
      },
    }),
    prisma.area.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, tipo: true, cor: true, geoJson: true },
    }),
    prisma.segmento.findMany({ where: { ativo: true }, select: { id: true, nome: true, cor: true }, orderBy: { ordem: "asc" } }),
  ]);

  const [totalEmpresas, semEndereco] = await Promise.all([
    prisma.empresa.count(),
    prisma.empresa.count({ where: { endereco: { is: null } } }),
  ]);
  const totalGeocodificadas = empresasRaw.length;
  const pct = totalEmpresas > 0 ? Math.round((totalGeocodificadas / totalEmpresas) * 100) : 0;
  const pendentes = totalEmpresas - totalGeocodificadas - semEndereco;

  const geocodingStatus = {
    total: totalEmpresas,
    geocodificadas: totalGeocodificadas,
    pendentes: Math.max(0, pendentes),
    semEndereco,
    percentual: pct,
  };

  const empresas: EmpresaPin[] = empresasRaw.map((e) => ({
    id: e.id,
    razaoSocial: e.razaoSocial,
    porte: e.porte,
    situacao: e.situacao,
    bairro: e.endereco?.bairro ?? "—",
    segmentoNome: e.segmento?.nome ?? null,
    segmentoCor: e.segmento?.cor ?? null,
    lat: e.lat!,
    lng: e.lng!,
  }));

  const areas: AreaOverlay[] = areasRaw.map((a) => ({
    id: a.id, nome: a.nome, tipo: a.tipo, cor: a.cor, geoJson: a.geoJson,
  }));

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Visualização Espacial</p>
            <h2 className="text-2xl font-bold text-[#1b3383]">Mapa Econômico</h2>
            <p className="text-sm text-slate-600">
              {totalGeocodificadas} de {totalEmpresas} empresas geocodificadas ({pct}%)
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#f0f3fa] px-3 py-2 text-sm font-semibold text-[#1b3383]">
            <Map className="h-4 w-4" />
            {areas.length} área{areas.length !== 1 ? "s" : ""} demarcada{areas.length !== 1 ? "s" : ""}
          </div>
        </div>
      </section>

      {/* Painel de geocodificação — status + botão de lote */}
      <GeocodingPanel status={geocodingStatus} isAdmin={isAdmin} />

      {/* KPIs por segmento — dinâmicos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {segmentos.map((seg) => {
          const count = empresas.filter((e) => e.segmentoNome === seg.nome).length;
          return (
            <div key={seg.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: seg.cor ?? "#94a3b8" }} />
                <p className="truncate text-xs font-medium text-slate-600">{seg.nome}</p>
              </div>
              <p className="mt-1 text-xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-400">no mapa</p>
            </div>
          );
        })}
      </div>

      {/* Mapa principal */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="h-4 w-4 text-[#1b3383]" />
            Mapa Interativo
            {/* Legenda de segmentos — dinâmica */}
            <div className="ml-auto flex flex-wrap gap-1.5">
              {segmentos.map((s) => (
                <span key={s.id} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: s.cor ?? "#1b3383" }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                  {s.nome}
                </span>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4 px-4">
          {empresas.length > 0 ? (
            <MapaContainer empresas={empresas} areas={areas} height="520px" />
          ) : (
            <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-center">
              <MapPin className="h-12 w-12 text-slate-300" />
              <div>
                <p className="font-semibold text-slate-600">Nenhuma empresa geocodificada ainda</p>
                <p className="mt-1 text-sm text-slate-400">
                  As coordenadas são obtidas automaticamente pelo CEP ao salvar uma empresa.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de áreas */}
      {areas.length > 0 && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Áreas Demarcadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {areas.map((area) => (
                <div key={area.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                  <div className="h-4 w-4 flex-shrink-0 rounded-full" style={{ backgroundColor: area.cor ?? "#94a3b8" }} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{area.nome}</p>
                    <p className="truncate text-xs text-slate-400">{area.tipo}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
