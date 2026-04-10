import { EmpresaFiltros } from "@/components/empresas/empresa-filtros";
import { EmpresaTable } from "@/components/empresas/empresa-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findEmpresas } from "@/lib/services/empresa/query";
import { filtrosEmpresaSchema } from "@/lib/validations/empresa";
import type { CategoriaOption } from "@/types/empresa";
import { PapelUsuario } from "@prisma/client";
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
  const [empresas, categorias] = await Promise.all([
    findEmpresas(filtros),
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
  ]);

  const role = session?.user?.role ?? PapelUsuario.VISUALIZADOR;

  const qs = new URLSearchParams();
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      qs.append(key, String(value));
    }
  });

  return (
    <main className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <EmpresaFiltros filtros={filtros} categorias={categorias as CategoriaOption[]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Empresas ({empresas.length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Link href={`/api/export/csv?${qs.toString()}`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Exportar CSV
              </Link>
              <Link href={`/api/export/xlsx?${qs.toString()}`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Exportar XLSX
              </Link>
              <Link href={`/api/export/pdf?${qs.toString()}`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Exportar PDF
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Use as opcoes abaixo para cadastro, edicao e controle por perfil.</p>
        </CardContent>
      </Card>

      <EmpresaTable empresas={empresas} categorias={categorias as CategoriaOption[]} role={role} />
    </main>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
