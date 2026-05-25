import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeUserRole } from "@/lib/permissions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = normalizeUserRole(session.user.role);
  const usuarioId = Number(session.user.id);

  // Carrega segmentos visíveis para este usuário
  // Se o usuário tem segmentos restritos → mostra só os dele; caso contrário → todos ativos
  const [segmentosUsuario, segmentosAtivos] = await Promise.all([
    prisma.usuarioSegmento.findMany({
      where: { usuarioId },
      select: { segmento: { select: { id: true, nome: true, slug: true, cor: true, icone: true, ordem: true } } },
    }),
    prisma.segmento.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, slug: true, cor: true, icone: true, ordem: true },
      orderBy: { ordem: "asc" },
    }),
  ]);

  const segmentos =
    segmentosUsuario.length > 0
      ? segmentosUsuario.map((us) => us.segmento).sort((a, b) => a.ordem - b.ordem)
      : segmentosAtivos;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header role={role} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 lg:flex-row lg:items-start lg:gap-6 lg:py-6">
        <div className="lg:sticky lg:top-4">
          <Sidebar role={role} segmentos={segmentos} />
        </div>
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
