import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cog, Database, ShieldCheck } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <main className="space-y-8">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Sistema</p>
            <h2 className="text-2xl font-bold text-[#1b3383]">Configuracoes</h2>
            <p className="text-sm text-slate-600">
              Defina parametros operacionais, politicas de acesso e preferencias de plataforma.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#f0f3fa] px-3 py-2 text-sm font-semibold text-[#1b3383]">
            <Cog className="h-4 w-4" />
            Ambiente Controlado
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-[#1b3383]" />
              Politicas de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">
              Em breve: configuracao de papeis, trilhas de auditoria e controles de sessao.
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-[#1b3383]" />
              Integracoes e Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">
              Em breve: parametros de exportacao, atualizacao de cache e fontes de dados.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
