import { EmpresasPorBairro } from "@/components/charts/empresas-por-bairro";
import { EmpresasPorCategoria } from "@/components/charts/empresas-por-categoria";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MiniMapa from "@/components/mapa/mini-mapa";
import { getDashboardResumo } from "@/lib/services/dashboard/query";
import { prisma } from "@/lib/prisma";
import {
  Building2, FileBarChart2, FileText, Layers,
  Map, MapPin, Plus, Users2,
} from "lucide-react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";

function SegmentoIcon({ nome, className }: { nome: string | null; className?: string }) {
  const Icon = nome
    ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[nome]
    : null;
  if (Icon) return <Icon className={className} />;
  return <Building2 className={className} />;
}

export default async function DashboardPage() {
  let erroResumo = false;
  let resumo = {
    totalEmpresas: 0,
    totalEmpregados: 0,
    categoria: [] as Array<{ categoria: string; totalEmpresas: number }>,
    bairro: [] as Array<{ bairro: string; totalEmpresas: number }>,
  };

  const [segmentos, totalAreas] = await Promise.all([
    prisma.segmento.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, slug: true, cor: true, icone: true },
      orderBy: { ordem: "asc" },
    }),
    prisma.area.count({ where: { ativo: true } }),
  ]);

  // Conta empresas e empregados por segmento de forma dinâmica
  const statsPorSegmento = await Promise.all(
    segmentos.map(async (seg) => {
      const [totalEmpresas, empregados] = await Promise.all([
        prisma.empresa.count({ where: { segmentoId: seg.id } }),
        prisma.empresa.aggregate({ where: { segmentoId: seg.id }, _sum: { numeroEmpregados: true } }),
      ]);
      return { ...seg, totalEmpresas, totalEmpregados: empregados._sum.numeroEmpregados ?? 0 };
    })
  );

  try {
    const dados = await getDashboardResumo();
    resumo = {
      totalEmpresas: dados.totalEmpresas,
      totalEmpregados: dados.totalEmpregados,
      categoria: dados.categoria,
      bairro: dados.bairro,
    };
  } catch {
    erroResumo = true;
  }

  const kpiData = [
    { id: "empresas",   title: "Total de Empresas",   value: resumo.totalEmpresas,  icon: Building2, color: "primary" },
    { id: "empregados", title: "Total de Empregados",  value: resumo.totalEmpregados, icon: Users2,   color: "success" },
    { id: "segmentos",  title: "Segmentos Ativos",     value: segmentos.length,       icon: Layers,   color: "warning" },
    { id: "areas",      title: "Áreas Demarcadas",     value: totalAreas,             icon: MapPin,   color: "info"    },
  ];

  return (
    <main className="space-y-8">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Visão Geral</p>
            <h2 className="mt-1 text-2xl font-bold text-[#1b3383]">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-600">
              Panorama econômico do município — todos os segmentos
            </p>
          </div>
          <Link href="/segmentos/comercio/novo" className="btn-cta hidden sm:flex">
            <Plus className="h-4 w-4" />
            Nova Empresa
          </Link>
        </div>
      </section>

      {erroResumo && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Não foi possível carregar os dados do dashboard. Atualize a página em instantes.
        </section>
      )}

      {/* KPIs globais */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.id} className="kpi-card">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {kpi.title}
                </CardTitle>
                <div className={`kpi-icon kpi-icon-${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="kpi-value">{kpi.value.toLocaleString("pt-BR")}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Cards por segmento — dinâmicos, zero hardcode */}
      {statsPorSegmento.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Por Segmento
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {statsPorSegmento.map((seg) => (
              <Link
                key={seg.id}
                href={`/segmentos/${seg.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: seg.cor ? `${seg.cor}18` : "#f0f3fa" }}
                  >
                    <SegmentoIcon nome={seg.icone} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800 group-hover:text-[#1b3383]">
                      {seg.nome}
                    </p>
                    <p className="text-xs text-slate-500">
                      {seg.totalEmpresas} empresa{seg.totalEmpresas !== 1 ? "s" : ""} · {seg.totalEmpregados.toLocaleString("pt-BR")} empregados
                    </p>
                  </div>
                  <div
                    className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-white"
                    style={{ backgroundColor: seg.cor ?? "#1b3383" }}
                  >
                    {seg.totalEmpresas}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Gráficos */}
      {!erroResumo && (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4 text-[#1b3383]" />
                Empresas por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <EmpresasPorCategoria data={resumo.categoria} />
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-[#1b3383]" />
                Empresas por Bairro
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <EmpresasPorBairro data={resumo.bairro} />
            </CardContent>
          </Card>
        </section>
      )}

      {/* Mini-mapa compacto */}
      <section>
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Map className="h-4 w-4 text-[#1b3383]" />
              Mini-mapa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <MiniMapa />
          </CardContent>
        </Card>
      </section>

      {/* Ações rápidas */}
      <section className="rounded-xl border border-[#d7deef] bg-gradient-to-br from-white to-[#f7f9ff] p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Acesso Rápido</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {segmentos.slice(0, 3).map((seg) => (
            <Link key={seg.id} href={`/segmentos/${seg.slug}`} className="btn-secondary py-2.5 text-xs">
              <SegmentoIcon nome={seg.icone} className="h-4 w-4" />
              {seg.nome}
            </Link>
          ))}
          <Link href="/mapa" className="btn-secondary py-2.5 text-xs">
            <Map className="h-4 w-4" />
            Mapa
          </Link>
          <Link href="/relatorios" className="btn-secondary py-2.5 text-xs">
            <FileBarChart2 className="h-4 w-4" />
            Relatórios
          </Link>
        </div>
      </section>
    </main>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
