import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { PapelUsuario } from "@prisma/client";
import { MapPin, Plus } from "lucide-react";
import Link from "next/link";

export default async function AreasPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? PapelUsuario.VISUALIZADOR;
  const canEdit = role === "ADMIN" || role === "ANALISTA";

  const [areas, segmentos] = await Promise.all([
    prisma.area.findMany({
      where: { ativo: true },
      include: { segmento: { select: { id: true, nome: true, slug: true, cor: true } } },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.segmento.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, slug: true, cor: true },
      orderBy: { ordem: "asc" },
    }),
  ]);

  // Agrupa por tipo para exibição
  const tipos = [...new Set(areas.map((a) => a.tipo))];

  return (
    <main className="space-y-8">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Zoneamento</p>
            <h2 className="text-2xl font-bold text-[#1b3383]">Áreas</h2>
            <p className="text-sm text-slate-600">
              Zonas geográficas demarcadas com parâmetros econômicos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-[#f0f3fa] px-3 py-2 text-sm font-semibold text-[#1b3383]">
              <MapPin className="h-4 w-4" />
              {areas.length} área{areas.length !== 1 ? "s" : ""}
            </div>
            {canEdit && (
              <Link
                href="/areas/nova"
                className="flex items-center gap-1.5 rounded-lg bg-[#1b3383] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2a4ba6]"
              >
                <Plus className="h-4 w-4" />
                Nova Área
              </Link>
            )}
          </div>
        </div>
      </section>

      {areas.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <MapPin className="h-12 w-12 text-slate-300" />
            <p className="font-semibold text-slate-600">Nenhuma área cadastrada</p>
            <p className="text-sm text-slate-400">
              Cadastre zonas como "Potencial de Empreendimento", "Zona Industrial" e outras.
            </p>
            {canEdit && (
              <Link
                href="/areas/nova"
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#1b3383] px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Cadastrar primeira área
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {tipos.map((tipo) => {
            const areasDoTipo = areas.filter((a) => a.tipo === tipo);
            return (
              <Card key={tipo} className="card-elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-[#1b3383]" />
                    {tipo}
                    <span className="ml-auto text-sm font-normal text-slate-400">
                      {areasDoTipo.length} área{areasDoTipo.length !== 1 ? "s" : ""}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {areasDoTipo.map((area) => (
                      <div
                        key={area.id}
                        className="group relative rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: area.cor ?? "#94a3b8" }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800">{area.nome}</p>
                            {area.descricao && (
                              <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{area.descricao}</p>
                            )}
                            {area.segmento && (
                              <span
                                className="mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                                style={{ backgroundColor: area.segmento.cor ?? "#1b3383" }}
                              >
                                {area.segmento.nome}
                              </span>
                            )}
                          </div>
                        </div>
                        {canEdit && (
                          <Link
                            href={`/areas/${area.id}`}
                            className="absolute inset-0 rounded-lg"
                            aria-label={`Editar ${area.nome}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
