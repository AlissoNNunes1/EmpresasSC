import { EmpresaFiltros } from "@/components/empresas/empresa-filtros";
import { EmpresaTable } from "@/components/empresas/empresa-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCamposVisiveis } from "@/lib/services/campo/query";
import { findEmpresas } from "@/lib/services/empresa/query";
import { filtrosEmpresaSchema } from "@/lib/validations/empresa";
import type { CategoriaOption } from "@/types/empresa";
import { PapelUsuario } from "@prisma/client";
import { Building2, Search } from "lucide-react";
import { getServerSession } from "next-auth";
import type { CampoEmpresaConfig } from "@/services/campos.service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function queryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EmpresasPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  const filtrosParse = filtrosEmpresaSchema.safeParse({
    categoriaId: queryValue(params.categoriaId),
    bairro: queryValue(params.bairro),
    porte: queryValue(params.porte),
    situacao: queryValue(params.situacao),
    minEmpregados: queryValue(params.minEmpregados),
    maxEmpregados: queryValue(params.maxEmpregados),
    termo: queryValue(params.termo),
  });

  const filtros = filtrosParse.success ? filtrosParse.data : {};
  let erroConsulta = false;
  let empresas = [] as Awaited<ReturnType<typeof findEmpresas>>;
  let categorias = [] as Awaited<ReturnType<typeof prisma.categoria.findMany>>;

  let campos: Awaited<ReturnType<typeof getCamposVisiveis>> = [];
  try {
    [empresas, categorias, campos] = await Promise.all([
      findEmpresas(filtros),
      prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
      getCamposVisiveis(),
    ]);
  } catch {
    erroConsulta = true;
  }

  const role = session?.user?.role ?? PapelUsuario.VISUALIZADOR;

  const qs = new URLSearchParams();
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      qs.append(key, String(value));
    }
  });

  const temFiltrosAtivos = qs.toString().length > 0;

  return (
    <main className="space-y-8">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Módulo Principal</p>
            <h2 className="text-2xl font-bold text-[#1b3383]">Empresas</h2>
            <p className="text-sm text-slate-600">
              Cadastre, filtre, edite e exporte registros de empresas.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#f0f3fa] px-3 py-2 text-sm font-semibold text-[#1b3383]">
            <Building2 className="h-4 w-4" />
            {empresas.length} registro{empresas.length !== 1 ? "s" : ""}
          </div>
        </div>
      </section>

      {erroConsulta ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Não foi possível carregar os dados de empresas no momento. Atualize a página e tente novamente.
        </section>
      ) : null}

      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-[#1b3383]" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmpresaFiltros filtros={filtros} categorias={categorias as CategoriaOption[]} />
        </CardContent>
      </Card>

      {!erroConsulta ? (
        <EmpresaTable
          empresas={empresas}
          categorias={categorias as CategoriaOption[]}
          role={role}
          campos={campos.map((c) => ({ ...c, tipo: c.tipo as CampoEmpresaConfig["tipo"], criadoEm: c.criadoEm.toISOString(), atualizadoEm: c.atualizadoEm.toISOString() }))}
          exportCsvUrl={`/api/export/csv?${qs.toString()}`}
          exportXlsxUrl={`/api/export/xlsx?${qs.toString()}`}
          exportPdfUrl={`/api/export/pdf?${qs.toString()}`}
          temFiltrosAtivos={temFiltrosAtivos}
        />
      ) : null}
    </main>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
