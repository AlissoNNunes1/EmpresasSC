import { registerAccessLog } from "@/lib/access-log";
import { refreshDashboardCacheViews } from "@/lib/services/dashboard/refresh";
import { manterEExcluirDemais, RevisaoDuplicataError } from "@/lib/services/duplicatas/revisao";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const corpoSchema = z.object({
  manterId: z.number().int().positive(),
  removerIds: z.array(z.number().int().positive()).min(1),
});

/** POST /api/duplicatas/manter — mantém a empresa escolhida e exclui as demais. Exclusão é irreversível. */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) return auth.denied;

  const parsed = corpoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos para a revisão" }, { status: 400 });

  try {
    const removidas = await manterEExcluirDemais(parsed.data.manterId, parsed.data.removerIds);
    await registerAccessLog({
      usuarioId: Number(auth.session.user.id),
      email: auth.session.user.email ?? undefined,
      rota: "/api/duplicatas/manter",
      acao: `EXCLUIR_DUPLICATAS(manter=${parsed.data.manterId}, removidas=${removidas})`,
      request,
    });
    if (removidas > 0) {
      await refreshDashboardCacheViews();
    }
    return NextResponse.json({ removidas });
  } catch (erro) {
    if (erro instanceof RevisaoDuplicataError) return NextResponse.json({ error: erro.message }, { status: 409 });
    throw erro;
  }
}
