import { LoginForm } from "@/components/layout/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  let session = null;

  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }

    console.warn("Falha ao ler sessao no login. Cookie JWT pode estar invalido.", error);
  }

  if (session?.user?.id) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-100 via-sky-50 to-amber-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sistema Administrativo de Empresas</CardTitle>
          <p className="text-sm text-slate-600">Municipio de Sao Cristovao</p>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-xs text-slate-500">Usuario inicial: admin@empresassc.local</p>
        </CardContent>
      </Card>
    </main>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
