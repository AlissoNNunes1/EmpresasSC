import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Shield, Users } from "lucide-react";
import Link from "next/link";

export default function UsuariosPage() {
  return (
    <main className="space-y-8">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Administracao</p>
            <h2 className="text-2xl font-bold text-[#1b3383]">Usuarios</h2>
            <p className="text-sm text-slate-600">
              Controle de perfis, papeis e permissoes do sistema.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#f0f3fa] px-3 py-2 text-sm font-semibold text-[#1b3383]">
            <Shield className="h-4 w-4" />
            Permissoes Ativas
          </div>
        </div>
      </section>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-[#1b3383]" />
            Gestao de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-700">
            O modulo de usuarios sera expandido para cadastro, edicao e auditoria de acessos.
          </p>
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
            <p className="text-sm font-semibold text-slate-700">Sem dados para exibir ainda</p>
            <p className="mt-1 text-sm text-slate-600">
              Continue usando a area de empresas enquanto finalizamos a gestao completa de usuarios.
            </p>
            <div className="mt-4">
              <Link href="/configuracoes" className="btn-secondary">
                <Plus className="h-4 w-4" />
                Configurar Perfis
              </Link>
            </div>
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
