import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Header } from "@/components/layout/header";
import { LogoutButton } from "@/components/layout/logout-button";
import { Sidebar } from "@/components/layout/sidebar";
import { authOptions } from "@/lib/auth";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header role={session.user.role} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 lg:flex-row lg:items-start">
        <Sidebar />
        <div className="w-full space-y-4">
          <div className="flex justify-end">
            <LogoutButton />
          </div>
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
