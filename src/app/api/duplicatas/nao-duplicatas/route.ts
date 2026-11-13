import { registerAccessLog } from "@/lib/access-log";
import { marcarComoNaoDuplicatas, RevisaoDuplicataError } from "@/lib/services/duplicatas/revisao";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const corpoSchema = z.object({
  empresaIds: z.array(z.number().int().positive()).min(2),
});

/** POST /api/duplicatas/nao-duplicatas — marca o grupo inteiro como "não são duplicatas". */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);
  if (auth.denied) return auth.denied;

  const parsed = corpoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Informe ao menos duas empresas" }, { status: 400 });

  try {
    const registradas = await marcarComoNaoDuplicatas(parsed.data.empresaIds);
    await registerAccessLog({
      usuarioId: Number(auth.session.user.id),
      email: auth.session.user.email ?? undefined,
      rota: "/api/duplicatas/nao-duplicatas",
      acao: "MARCAR_NAO_DUPLICATAS",
      request,
    });
    return NextResponse.json({ registradas });
  } catch (erro) {
    if (erro instanceof RevisaoDuplicataError) return NextResponse.json({ error: erro.message }, { status: 409 });
    throw erro;
  }
}
