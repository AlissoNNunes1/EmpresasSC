import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { PapelUsuario } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { params: Promise<{ slug: string }> };

export default async function ConfigSegmentoPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? PapelUsuario.VISUALIZADOR;
  if (role !== PapelUsuario.ADMIN) redirect("/configuracoes");

  const { slug } = await params;

  const [segmento, todasCategorias, camposCustom, areas] = await Promise.all([
    prisma.segmento.findUnique({ where: { slug } }),
    prisma.categoria.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.campoEmpresa.findMany({ where: { builtin: false, visivel: true }, orderBy: { ordem: "asc" } }),
    prisma.area.findMany({
      where: { ativo: true, segmento: { slug } },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  if (!segmento) notFound();

  const totalEmpresas = await prisma.empresa.count({ where: { segmentoId: segmento.id } });

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3">
          <Link href="/configuracoes" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: segmento.cor ? `${segmento.cor}20` : "#f0f3fa" }}
          >
            <Layers className="h-5 w-5" style={{ color: segmento.cor ?? "#1b3383" }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Configurações › Segmentos</p>
            <h2 className="text-2xl font-bold text-[#1b3383]">{segmento.nome}</h2>
            {segmento.descricao && (
              <p className="text-sm text-slate-500">{segmento.descricao}</p>
            )}
          </div>
          <div className="ml-auto rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ backgroundColor: segmento.cor ?? "#1b3383" }}>
            {totalEmpresas} empresa{totalEmpresas !== 1 ? "s" : ""}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Categorias disponíveis */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Categorias Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            {todasCategorias.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma categoria cadastrada.</p>
            ) : (
              <ul className="space-y-1.5">
                {todasCategorias.map((cat) => (
                  <li key={cat.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                    <span className="h-2 w-2 rounded-full bg-[#1b3383]" />
                    {cat.nome}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Gerencie as categorias em{" "}
              <Link href="/configuracoes" className="underline hover:text-slate-600">
                Configurações › Categorias
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        {/* Campos customizados ativos */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Campos Customizados Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {camposCustom.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum campo customizado ativo.</p>
            ) : (
              <ul className="space-y-1.5">
                {camposCustom.map((campo) => (
                  <li key={campo.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                    <span>{campo.label}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono text-slate-500">{campo.tipo}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Gerencie os campos em{" "}
              <Link href="/configuracoes" className="underline hover:text-slate-600">
                Configurações › Campos
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        {/* Áreas associadas */}
        <Card className="card-elevated lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Áreas Associadas a este Segmento</CardTitle>
            <Link
              href="/areas/nova"
              className="text-xs font-semibold text-[#1b3383] hover:underline"
            >
              + Nova Área
            </Link>
          </CardHeader>
          <CardContent>
            {areas.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nenhuma área associada a {segmento.nome}.{" "}
                <Link href="/areas/nova" className="underline hover:text-slate-600">
                  Criar uma área
                </Link>
                .
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {areas.map((area) => (
                  <Link
                    key={area.id}
                    href={`/areas/${area.id}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="h-4 w-4 flex-shrink-0 rounded-full" style={{ backgroundColor: area.cor ?? "#94a3b8" }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{area.nome}</p>
                      <p className="text-xs text-slate-400">{area.tipo}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info do segmento */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">Identificação do Segmento</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Slug (URL)</dt>
              <dd className="mt-0.5 font-mono text-slate-700">{segmento.slug}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cor</dt>
              <dd className="mt-0.5 flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: segmento.cor ?? "#94a3b8" }} />
                <span className="font-mono text-slate-700">{segmento.cor ?? "—"}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ícone</dt>
              <dd className="mt-0.5 font-mono text-slate-700">{segmento.icone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</dt>
              <dd className="mt-0.5">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${segmento.ativo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {segmento.ativo ? "Ativo" : "Inativo"}
                </span>
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-slate-400">
            Edite nome, cor e ícone em{" "}
            <Link href="/configuracoes" className="underline hover:text-slate-600">
              Configurações › Segmentos
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
