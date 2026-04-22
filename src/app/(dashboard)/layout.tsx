import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { authOptions } from "@/lib/auth";
import { normalizeUserRole } from "@/lib/permissions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = normalizeUserRole(session.user.role);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header role={role} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 lg:flex-row lg:items-start lg:gap-6 lg:py-6">
        <div className="lg:sticky lg:top-4">
          <Sidebar role={role} />
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
