import { NextRequest, NextResponse } from "next/server";
import { PapelUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/session";
import { registerAccessLog } from "@/lib/access-log";
import { configuracaoSistemaSchema } from "@/lib/validations/configuracao";
import { getConfiguracaoSistema } from "@/lib/services/configuracao/query";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) {
    return auth.denied;
  }

  const config = await getConfiguracaoSistema();

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: "/api/config",
    acao: "CONSULTAR_CONFIG_SISTEMA",
    request,
  });

  return NextResponse.json({ data: config });
}

export async function PUT(request: NextRequest) {
  const auth = await requireApiAuth(request, PapelUsuario.ADMIN);
  if (auth.denied) {
    return auth.denied;
  }

  const body = await request.json();
  const parsed = configuracaoSistemaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados invalidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const atual = await getConfiguracaoSistema();

  const updated = await prisma.configuracaoSistema.update({
    where: { id: atual.id },
    data: {
      nomeSistema: parsed.data.nomeSistema,
      nomeMunicipio: parsed.data.nomeMunicipio,
      logoUrl: parsed.data.logoUrl ?? null,
      emailInstitucional: parsed.data.emailInstitucional,
      minEmpregadosPequena: parsed.data.minEmpregadosPequena,
      maxEmpregadosPequena: parsed.data.maxEmpregadosPequena,
      minEmpregadosMedia: parsed.data.minEmpregadosMedia,
      maxEmpregadosMedia: parsed.data.maxEmpregadosMedia,
      categoriaPadraoId: parsed.data.categoriaPadraoId ?? null,
      politicaSenhaMinCaracteres: parsed.data.politicaSenhaMinCaracteres,
      tempoSessaoMinutos: parsed.data.tempoSessaoMinutos,
      controleLoginAtivo: parsed.data.controleLoginAtivo,
      integracaoCnpjAtiva: parsed.data.integracaoCnpjAtiva,
      webhookUrl: parsed.data.webhookUrl ?? null,
    },
    include: { categoriaPadrao: true },
  });

  await registerAccessLog({
    usuarioId: Number(auth.session?.user.id),
    email: auth.session?.user.email ?? undefined,
    rota: "/api/config",
    acao: "ATUALIZAR_CONFIG_SISTEMA",
    request,
  });

  return NextResponse.json({ data: updated });
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
