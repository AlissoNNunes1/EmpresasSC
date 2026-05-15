import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RelatorioBuilder } from "@/components/relatorios/relatorio-builder";
import { prisma } from "@/lib/prisma";
import { BarChart3, Download, FileText } from "lucide-react";
import Link from "next/link";

export default async function RelatoriosPage() {
  const categorias = await prisma.categoria.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  const exportQs = new URLSearchParams();
  exportQs.set("source", "relatorios");

  return (
    <main className="space-y-8">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Análise</p>
            <h2 className="text-2xl font-bold text-[#1b3383]">Relatórios</h2>
            <p className="text-sm text-slate-600">
              Explore os dados de empresas com o construtor interativo ou exporte relatórios completos.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#f0f3fa] px-3 py-2 text-sm font-semibold text-[#1b3383]">
            <BarChart3 className="h-4 w-4" />
            BI Interativo
          </div>
        </div>
      </section>

      <RelatorioBuilder categorias={categorias} />

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-[#1b3383]" />
            Exportações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-700">
            Para exportar com filtros específicos, aplique os filtros na tela de empresas antes de exportar.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link href={`/api/export/csv?${exportQs.toString()}`} className="btn-secondary">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Link>
            <Link href={`/api/export/xlsx?${exportQs.toString()}`} className="btn-secondary">
              <Download className="h-4 w-4" />
              Exportar XLSX
            </Link>
            <Link href={`/api/export/pdf?${exportQs.toString()}`} className="btn-secondary">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
