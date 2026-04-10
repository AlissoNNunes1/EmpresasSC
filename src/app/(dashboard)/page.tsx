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
    FileSpreadsheet,
    FileText,
    RefreshCw,
    Layers,
    MapPin,
    Plus,
    Users2,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  let erroResumo = false;
  let resumo = {
    totalEmpresas: 0,
    totalEmpregados: 0,
    categoria: [] as Array<{ categoria: string; totalEmpresas: number }>,
    bairro: [] as Array<{ bairro: string; totalEmpresas: number }>,
  };

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

  const temDados = resumo.totalEmpresas > 0 || resumo.totalEmpregados > 0;

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
      color: "info",
      trend: "+1 novo",
    },
  ];

  return (
    <main className="space-y-10">
      {/* Cabecalho contextual com menor peso visual */}
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">
              Visao Geral
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#1b3383]">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-600">
              Visão geral das empresas e operações em São Cristóvão
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <Link
              href="/empresas/novo"
              className="btn-cta inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Nova Empresa</span>
            </Link>
            <Link href="/relatorios" className="btn-secondary inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="text-sm">Exportar Dados</span>
            </Link>
          </div>
        </div>
      </section>

      {erroResumo && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Nao foi possivel carregar os dados do dashboard agora. Atualize a pagina em alguns instantes.
        </section>
      )}

      {!erroResumo && !temDados && (
        <section className="rounded-xl border border-[#d7deef] bg-[#f7f9ff] p-4 text-sm text-slate-700">
          Ainda nao ha dados suficientes para analise. Cadastre empresas para visualizar indicadores e graficos.
        </section>
      )}

      {/* KPI Cards com hierarquia visual melhorada */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.id} className="kpi-card h-full">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {kpi.title}
                </CardTitle>
                <div className={`kpi-icon kpi-icon-${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="kpi-value">
                  {kpi.value.toLocaleString("pt-BR")}
                </p>
                <p className="kpi-trend">Tendencia: {kpi.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Seção de Gráficos */}
      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
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

      {/* Seção de Ações Rapidas com prioridade visual clara */}
      <section className="rounded-xl border border-[#d7deef] bg-gradient-to-br from-white to-[#f7f9ff] p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1b3383]">
          <RefreshCw className="h-5 w-5" />
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/empresas/novo" className="btn-cta py-3">
            <Plus className="h-4 w-4" />
            <span>Cadastrar Empresa</span>
          </Link>
          <Link href="/empresas" className="btn-secondary py-3">
            <Building2 className="h-4 w-4" />
            <span>Ver Empresas</span>
          </Link>
          <Link href="/usuarios" className="btn-secondary py-3">
            <Users2 className="h-4 w-4" />
            <span>Gerenciar Usuários</span>
          </Link>
          <Link href="/relatorios" className="btn-secondary py-3">
            <FileText className="h-4 w-4" />
            <span>Relatórios</span>
          </Link>
          <Link href="/configuracoes" className="btn-secondary py-3 sm:col-span-2 xl:col-span-1">
            <FileSpreadsheet className="h-4 w-4" />
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
