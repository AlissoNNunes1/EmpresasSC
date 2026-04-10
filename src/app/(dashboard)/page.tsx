import { EmpresasPorBairro } from "@/components/charts/empresas-por-bairro";
import { EmpresasPorCategoria } from "@/components/charts/empresas-por-categoria";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { getDashboardResumo } from "@/lib/services/dashboard/query";
import {
    Building2,
    Download,
    Layers,
    MapPin,
    Plus,
    Users2,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const resumo = await getDashboardResumo();

  // Dados do KPI com contexto visual
  const kpiData = [
    {
      id: "empresas",
      title: "Total de Empresas",
      value: resumo.totalEmpresas,
      icon: Building2,
      color: "primary",
      trend: "+2.5%",
    },
    {
      id: "empregados",
      title: "Total de Empregados",
      value: resumo.totalEmpregados,
      icon: Users2,
      color: "success",
      trend: "+5.1%",
    },
    {
      id: "categorias",
      title: "Categorias Ativas",
      value: resumo.categoria.length,
      icon: Layers,
      color: "warning",
      trend: "Estável",
    },
    {
      id: "bairros",
      title: "Bairros Mapeados",
      value: resumo.bairro.length,
      icon: MapPin,
      color: "accent",
      trend: "+1 novo",
    },
  ];

  return (
    <main className="space-y-8">
      {/* Seção de Bem-vindo e CTAs principais - reduzida em peso */}
      <section className="rounded-lg bg-gradient-to-r from-[#1b3383] to-[#2a4ba6] p-4 text-white shadow-md sm:p-5">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-1 text-xs text-blue-100 sm:text-sm">
              Visão geral das empresas e operações em São Cristóvão
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href="/empresas/novo"
              className="btn-cta inline-flex items-center gap-2 bg-white text-[#1b3383] hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm">Nova Empresa</span>
            </Link>
            <button className="btn-secondary inline-flex items-center gap-2 border-white bg-white bg-opacity-10 text-white hover:bg-opacity-20">
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm">Exportar</span>
            </button>
          </div>
        </div>
      </section>

      {/* KPI Cards com hierarquia visual melhorada */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.id} className="kpi-card">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {kpi.title}
                </CardTitle>
                <div className={`kpi-icon kpi-icon-${kpi.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="kpi-value">
                  {kpi.value.toLocaleString("pt-BR")}
                </p>
                <p className="kpi-trend">{kpi.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Seção de Gráficos */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-5 w-5 text-[#1b3383]" />
              Empresas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmpresasPorCategoria data={resumo.categoria} />
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-[#1b3383]" />
              Empresas por Bairro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmpresasPorBairro data={resumo.bairro} />
          </CardContent>
        </Card>
      </section>

      {/* Seção de Ações Rápidas - com melhor hierarquia e espaço */}
      <section className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1b3383]">
          <Layers className="h-5 w-5" />
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/empresas" className="btn-secondary py-3">
            <Building2 className="h-4 w-4" />
            <span>Ver Empresas</span>
          </Link>
          <Link href="/usuarios" className="btn-secondary py-3">
            <Users2 className="h-4 w-4" />
            <span>Gerenciar Usuários</span>
          </Link>
          <Link href="/relatorios" className="btn-secondary py-3">
            <Download className="h-4 w-4" />
            <span>Relatórios</span>
          </Link>
          <Link href="/configuracoes" className="btn-secondary py-3">
            <Layers className="h-4 w-4" />
            <span>Configurações</span>
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
