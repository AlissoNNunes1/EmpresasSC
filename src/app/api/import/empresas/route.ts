import { NextRequest, NextResponse } from "next/server";
import { PapelUsuario } from "@prisma/client";
import { requireApiAuth } from "@/lib/session";
import { registerAccessLog } from "@/lib/access-log";
import { refreshDashboardCacheViews } from "@/lib/services/dashboard/refresh";
import { importarEmpresasInteligente, parseImportFile } from "@/lib/services/empresa/import";

const MODE_MAP = {
  upsert: "UPSERT",
  create_only: "CREATE_ONLY",
  update_only: "UPDATE_ONLY",
} as const;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth(request, PapelUsuario.ANALISTA);
    if (auth.denied) {
      return auth.denied;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo nao informado" }, { status: 400 });
    }

    const modeRaw = String(formData.get("mode") ?? "upsert").toLowerCase();
    const dryRunRaw = String(formData.get("dryRun") ?? "true").toLowerCase();

    const mode = MODE_MAP[modeRaw as keyof typeof MODE_MAP] ?? MODE_MAP.upsert;
    const dryRun = dryRunRaw === "true" || dryRunRaw === "1";

    const buffer = await file.arrayBuffer();
    const rows = parseImportFile(buffer);

    if (!rows.length) {
      return NextResponse.json({ error: "Nenhuma linha encontrada no arquivo" }, { status: 400 });
    }

    const resultado = await importarEmpresasInteligente(rows, {
      mode,
      dryRun,
      usuarioRole: auth.session.user.role,
    });

    await registerAccessLog({
      usuarioId: Number(auth.session.user.id),
      email: auth.session.user.email ?? undefined,
      rota: "/api/import/empresas",
      acao: dryRun ? "PREVIEW_IMPORT_EMPRESAS" : "IMPORT_EMPRESAS",
      request,
    });

    if (!dryRun && resultado.processadas > 0) {
      refreshDashboardCacheViews();
    }

    return NextResponse.json(resultado);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao importar empresas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
