import { EmpresaFiltros } from "@/components/empresas/empresa-filtros";
import { EmpresaTable } from "@/components/empresas/empresa-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findEmpresas } from "@/lib/services/empresa/query";
import { filtrosEmpresaSchema } from "@/lib/validations/empresa";
import type { CategoriaOption } from "@/types/empresa";
import { PapelUsuario } from "@prisma/client";
import { Building2, FileSpreadsheet, FileText, Search } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";

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

  try {
    [empresas, categorias] = await Promise.all([
      findEmpresas(filtros),
      prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
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
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Modulo Principal</p>
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
          Nao foi possivel carregar os dados de empresas no momento. Atualize a pagina e tente novamente.
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

      <Card className="card-elevated">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Resultados ({empresas.length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Link href={`/api/export/csv?${qs.toString()}`} className="btn-secondary">
                Exportar CSV
              </Link>
              <Link href={`/api/export/xlsx?${qs.toString()}`} className="btn-secondary">
                <FileSpreadsheet className="h-4 w-4" />
                Exportar XLSX
              </Link>
              <Link href={`/api/export/pdf?${qs.toString()}`} className="btn-secondary">
                <FileText className="h-4 w-4" />
                Exportar PDF
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">
            {temFiltrosAtivos
              ? "Filtros ativos aplicados aos resultados e exportacoes."
              : "Use os filtros para refinar a listagem e exportar recortes especificos."}
          </p>
        </CardContent>
      </Card>

      {!erroConsulta && empresas.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-700">Nenhuma empresa encontrada</p>
          <p className="mt-1 text-sm text-slate-600">
            Ajuste os filtros ou cadastre uma nova empresa para iniciar os registros.
          </p>
          <div className="mt-4">
            <Link href="/empresas/novo" className="btn-cta">
              Cadastrar Empresa
            </Link>
          </div>
        </section>
      ) : null}

      {!erroConsulta ? (
        <EmpresaTable empresas={empresas} categorias={categorias as CategoriaOption[]} role={role} />
      ) : null}
    </main>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
