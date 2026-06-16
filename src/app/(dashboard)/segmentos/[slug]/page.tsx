import { EmpresaFiltros } from "@/components/empresas/empresa-filtros";
import { EmpresaTable } from "@/components/empresas/empresa-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCamposVisiveis } from "@/lib/services/campo/query";
import { findEmpresas } from "@/lib/services/empresa/query";
import { filtrosEmpresaSchema } from "@/lib/validations/empresa";
import type { CampoEmpresaConfig } from "@/services/campos.service";
import type { CategoriaOption } from "@/types/empresa";
import { PapelUsuario } from "@prisma/client";
import { Search } from "lucide-react";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function queryValue(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function SegmentoPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const qp = await searchParams;
  const session = await getServerSession(authOptions);

  const segmento = await prisma.segmento.findUnique({ where: { slug, ativo: true } });
  if (!segmento) notFound();

  const filtrosParse = filtrosEmpresaSchema.safeParse({
    categoriaId: queryValue(qp.categoriaId),
    bairro: queryValue(qp.bairro),
    porte: queryValue(qp.porte),
    situacao: queryValue(qp.situacao),
    minEmpregados: queryValue(qp.minEmpregados),
    maxEmpregados: queryValue(qp.maxEmpregados),
    termo: queryValue(qp.termo),
    sortBy: queryValue(qp.sortBy),
    sortDir: queryValue(qp.sortDir),
  });

  const filtros = filtrosParse.success ? filtrosParse.data : {};

  let erroConsulta = false;
  let empresas = [] as Awaited<ReturnType<typeof findEmpresas>>;
  let categorias = [] as Awaited<ReturnType<typeof prisma.categoria.findMany>>;
  let campos: Awaited<ReturnType<typeof getCamposVisiveis>> = [];

  try {
    [empresas, categorias, campos] = await Promise.all([
      findEmpresas(filtros, slug),
      prisma.categoria.findMany({
        where: { OR: [{ segmentoId: null }, { segmentoId: segmento.id }] },
        orderBy: { nome: "asc" },
      }),
      getCamposVisiveis(segmento.id),
    ]);
  } catch {
    erroConsulta = true;
  }

  const role = session?.user?.role ?? PapelUsuario.VISUALIZADOR;

  const qs = new URLSearchParams();
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null) qs.append(key, String(value));
  });
  qs.set("segmentoSlug", slug);

  const temFiltrosAtivos = Object.keys(filtros).length > 0;

  return (
    <main className="space-y-8">
      <section
        className="rounded-xl border p-4 shadow-sm sm:p-5"
        style={{ borderColor: segmento.cor ?? "#d7deef", backgroundColor: "white" }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: segmento.cor ?? "#1b3383" }}
            >
              Segmento
            </p>
            <h2
              className="text-2xl font-bold"
              style={{ color: segmento.cor ?? "#1b3383" }}
            >
              {segmento.nome}
            </h2>
            {segmento.descricao && (
              <p className="text-sm text-slate-600">{segmento.descricao}</p>
            )}
          </div>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
            style={{
              backgroundColor: segmento.cor ? `${segmento.cor}18` : "#f0f3fa",
              color: segmento.cor ?? "#1b3383",
            }}
          >
            {empresas.length} registro{empresas.length !== 1 ? "s" : ""}
          </div>
        </div>
      </section>

      {erroConsulta ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Não foi possível carregar os dados. Atualize a página e tente novamente.
        </section>
      ) : null}

      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" style={{ color: segmento.cor ?? "#1b3383" }} />
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
          campos={campos.map((c) => ({
            ...c,
            tipo: c.tipo as CampoEmpresaConfig["tipo"],
            criadoEm: c.criadoEm.toISOString(),
            atualizadoEm: c.atualizadoEm.toISOString(),
          }))}
          exportCsvUrl={`/api/export/csv?${qs.toString()}`}
          exportXlsxUrl={`/api/export/xlsx?${qs.toString()}`}
          exportPdfUrl={`/api/export/pdf?${qs.toString()}`}
          temFiltrosAtivos={temFiltrosAtivos}
          segmentoSlug={slug}
        />
      ) : null}
    </main>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
