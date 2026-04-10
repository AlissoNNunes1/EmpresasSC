import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EmpresaDetalhePage({ params }: Props) {
  const { id } = await params;
  redirect(`/empresas?editar=${id}`);
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
