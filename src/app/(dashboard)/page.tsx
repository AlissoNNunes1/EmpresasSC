import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmpresasPorBairro } from "@/components/charts/empresas-por-bairro";
import { EmpresasPorCategoria } from "@/components/charts/empresas-por-categoria";
import { getDashboardResumo } from "@/lib/services/dashboard/query";
import {
  Building2,
  Users2,
  Layers,
  MapPin,
  Plus,
  Download,
} from "lucide-react";

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
    <main className="space-y-6">
      {/* Seção de Bem-vindo e CTAs principais */}
      <section className="rounded-lg bg-gradient-to-r from-[#1b3383] to-[#2a4ba6] p-6 text-white shadow-lg">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-blue-100">
              Visão geral das empresas e operações em São Cristóvão
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/empresas/novo"
              className="btn-cta inline-flex items-center gap-2 bg-white text-[#1b3383] hover:bg-blue-50"
            >
              <Plus className="h-5 w-5" />
              Nova Empresa
            </Link>
            <button className="btn-secondary inline-flex items-center gap-2 border-white bg-white bg-opacity-10 text-white hover:bg-opacity-20">
              <Download className="h-5 w-5" />
              Exportar
            </button>
          </div>
        </div>
      </section>

      {/* KPI Cards com ícones e contexto visual */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.id} className="kpi-card">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <div
                  className={`kpi-icon kpi-icon-${kpi.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-3xl font-bold text-[#1b3383]">
                  {kpi.value.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs font-medium text-slate-600">
                  {kpi.trend}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Seção de Gráficos */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
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
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-[#1b3383]" />
              Empresas por Bairro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmpresasPorBairro data={resumo.bairro} />
          </CardContent>
        </Card>
      </section>

      {/* Seção de Ações Rápidas */}
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#1b3383]">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/empresas" className="btn-secondary">
            <Building2 className="h-4 w-4" />
            Ver Empresas
          </Link>
          <Link href="/usuarios" className="btn-secondary">
            <Users2 className="h-4 w-4" />
            Gerenciar Usuários
          </Link>
          <Link href="/relatorios" className="btn-secondary">
            <Download className="h-4 w-4" />
            Gerar Relatórios
          </Link>
          <Link href="/configuracoes" className="btn-secondary">
            <Layers className="h-4 w-4" />
            Configurações
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
