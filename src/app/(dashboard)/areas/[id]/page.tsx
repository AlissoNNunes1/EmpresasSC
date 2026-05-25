import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { PapelUsuario } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import AreaEditor from "./area-editor";

type Props = { params: Promise<{ id: string }> };

export default async function EditarAreaPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? PapelUsuario.VISUALIZADOR;
  if (role === PapelUsuario.VISUALIZADOR) redirect("/areas");

  const { id } = await params;
  const areaId = Number(id);
  if (Number.isNaN(areaId)) notFound();

  const [area, segmentos] = await Promise.all([
    prisma.area.findUnique({ where: { id: areaId } }),
    prisma.segmento.findMany({ where: { ativo: true }, select: { id: true, nome: true, slug: true, cor: true }, orderBy: { ordem: "asc" } }),
  ]);

  if (!area) notFound();

  return <AreaEditor area={area} segmentos={segmentos} />;
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
