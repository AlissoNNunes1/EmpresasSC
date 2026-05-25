import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// /empresas agora redireciona para /segmentos/comercio
// Os bookmarks antigos continuam funcionando
export default async function EmpresasPage({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, Array.isArray(v) ? v[0] : v);
  }
  const query = qs.toString();
  redirect(`/segmentos/comercio${query ? `?${query}` : ""}`);
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
