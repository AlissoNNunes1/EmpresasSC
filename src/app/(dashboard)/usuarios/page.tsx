import { UsuarioTable } from "@/components/usuarios/usuario-table";
import { authOptions } from "@/lib/auth";
import { listUsuarios } from "@/lib/services/usuario/query";
import { PapelUsuario } from "@prisma/client";
import { Shield, Users } from "lucide-react";
import { getServerSession } from "next-auth";

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? PapelUsuario.VISUALIZADOR;

  if (role !== PapelUsuario.ADMIN) {
    return (
      <main className="space-y-6">
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-bold text-amber-800">Acesso restrito</h2>
          <p className="mt-2 text-sm text-amber-700">
            Somente usuarios admin podem gerenciar contas e permissões.
          </p>
        </section>
      </main>
    );
  }

  const usuarios = await listUsuarios();

  return (
    <main className="space-y-8">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Administracão</p>
            <h2 className="text-2xl font-bold text-[#1b3383]">Usuários</h2>
            <p className="text-sm text-slate-600">
              Controle de perfis, papéis e permissões do sistema.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#f0f3fa] px-3 py-2 text-sm font-semibold text-[#1b3383]">
            <Shield className="h-4 w-4" />
            RBAC Ativo
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-base font-semibold text-[#1b3383]">
          <Users className="h-4 w-4" />
          Gestao de Usuários
        </div>
        <UsuarioTable initialUsuarios={usuarios} currentUserId={Number(session?.user.id)} />
      </section>
    </main>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
