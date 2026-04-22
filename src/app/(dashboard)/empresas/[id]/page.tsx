import { EmpresaDetalheAcoes } from "@/components/empresas/empresa-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PapelUsuario } from "@prisma/client";
import { ArrowLeft, Building2, MapPin, UserRound } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EmpresaDetalhePage({ params }: Props) {
  const { id } = await params;
  const empresaId = Number(id);

  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? PapelUsuario.VISUALIZADOR;
  const canEdit = role === PapelUsuario.ADMIN || role === PapelUsuario.ANALISTA;
  const canDelete = role === PapelUsuario.ADMIN;

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    include: {
      categoria: true,
      endereco: true,
      responsaveis: true,
    },
  });

  if (!empresa) {
    notFound();
  }

  const categorias = await prisma.categoria.findMany({
    orderBy: {
      nome: "asc",
    },
    select: {
      id: true,
      nome: true,
    },
  });

  const formatCnpj = (cnpj: string): string => {
    const d = cnpj.replace(/\D/g, "");
    if (d.length !== 14) return cnpj;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
  };

  const formatCpf = (cpf: string): string => {
    const d = cpf.replace(/\D/g, "");
    if (d.length !== 11) return cpf;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
  };

  const formatCep = (cep: string): string => {
    const d = cep.replace(/\D/g, "");
    if (d.length !== 8) return cep;
    return `${d.slice(0, 5)}-${d.slice(5, 8)}`;
  };

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Detalhamento</p>
            <h2 className="text-2xl font-bold text-[#1b3383]">{empresa.razaoSocial}</h2>
            <p className="text-sm text-slate-600">CNPJ {formatCnpj(empresa.cnpj)}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/empresas" className="btn-secondary">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <EmpresaDetalheAcoes
              canEdit={canEdit}
              canDelete={canDelete}
              categorias={categorias}
              empresa={{
                id: empresa.id,
                razaoSocial: empresa.razaoSocial,
                nomeFantasia: empresa.nomeFantasia,
                cnpj: empresa.cnpj,
                porte: empresa.porte,
                categoriaId: empresa.categoriaId,
                atividadePrincipal: empresa.atividadePrincipal,
                numeroEmpregados: empresa.numeroEmpregados,
                situacao: empresa.situacao,
                endereco: empresa.endereco,
                responsaveis: empresa.responsaveis,
              }}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-[#1b3383]" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Razão social</p>
              <p className="text-sm font-medium text-slate-800">{empresa.razaoSocial}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Nome fantasia</p>
              <p className="text-sm font-medium text-slate-800">{empresa.nomeFantasia ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Categoria</p>
              <p className="text-sm font-medium text-slate-800">{empresa.categoria.nome}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Atividade principal</p>
              <p className="text-sm font-medium text-slate-800">{empresa.atividadePrincipal}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Porte</p>
              <p className="text-sm font-medium text-slate-800">{empresa.porte}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Situação</p>
              <p className="text-sm font-medium text-slate-800">{empresa.situacao}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Empregados</p>
              <p className="text-sm font-medium text-slate-800">{empresa.numeroEmpregados}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-[#1b3383]" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p><strong>CEP:</strong> {empresa.endereco?.cep ? formatCep(empresa.endereco.cep) : "-"}</p>
            <p><strong>Bairro:</strong> {empresa.endereco?.bairro ?? "-"}</p>
            <p><strong>Logradouro:</strong> {empresa.endereco?.logradouro ?? "-"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-[#1b3383]" />
            Responsáveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {empresa.responsaveis.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhum responsável cadastrado.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {empresa.responsaveis.map((responsavel) => (
                <div key={responsavel.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p><strong>Nome:</strong> {responsavel.nome}</p>
                  <p><strong>Tipo:</strong> {responsavel.tipo}</p>
                  <p><strong>CPF:</strong> {formatCpf(responsavel.cpf)}</p>
                  <p><strong>Contato:</strong> {responsavel.contato}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
