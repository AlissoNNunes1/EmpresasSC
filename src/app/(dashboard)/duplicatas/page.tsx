import { DuplicatasRevisao } from "@/components/duplicatas/duplicatas-revisao";
import { authOptions } from "@/lib/auth";
import { listarGruposDeDuplicatas } from "@/lib/services/duplicatas/revisao";
import { hasRequiredRole, normalizeUserRole } from "@/lib/permissions";
import { PapelUsuario } from "@prisma/client";
import { getServerSession } from "next-auth";

export default async function DuplicatasPage() {
  const session = await getServerSession(authOptions);
  const role = normalizeUserRole(session?.user?.role);
  const podeRemover = hasRequiredRole(role, PapelUsuario.ADMIN);

  const grupos = await listarGruposDeDuplicatas();

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-[#d7deef] bg-white p-4 shadow-sm sm:p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">Qualidade do cadastro</p>
          <h2 className="text-2xl font-bold text-[#1b3383]">Possíveis duplicatas</h2>
          <p className="text-sm text-slate-600">
            Empresas que podem ser o mesmo estabelecimento. Escolha qual manter, ou marque o grupo como “não são duplicatas”.
            {podeRemover
              ? " Excluir as outras é irreversível."
              : " Só administradores podem excluir empresas."}
          </p>
          <p className="text-sm font-semibold text-slate-700">
            {grupos.length} grupo{grupos.length !== 1 ? "s" : ""} pendente{grupos.length !== 1 ? "s" : ""}
          </p>
        </div>
      </section>

      <DuplicatasRevisao grupos={grupos} podeRemover={podeRemover} />
    </main>
  );
}
