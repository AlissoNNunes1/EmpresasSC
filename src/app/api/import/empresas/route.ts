import { registerAccessLog } from "@/lib/access-log";
import { prisma } from "@/lib/prisma";
import { refreshDashboardCacheViews } from "@/lib/services/dashboard/refresh";
import { importarEmpresasInteligente, parseImportFile } from "@/lib/services/empresa/import";
import { requireApiAuth } from "@/lib/session";
import { PapelUsuario } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json({ error: "Arquivo não informado" }, { status: 400 });
    }

    const modeRaw = String(formData.get("mode") ?? "upsert").toLowerCase();
    const dryRunRaw = String(formData.get("dryRun") ?? "true").toLowerCase();
    const mergeDecisionsRaw = formData.get("mergeDecisions");

    const mode = MODE_MAP[modeRaw as keyof typeof MODE_MAP] ?? MODE_MAP.upsert;
    const dryRun = dryRunRaw === "true" || dryRunRaw === "1";
    let mergeDecisions: Record<string, Record<string, "ARQUIVO" | "BANCO">> | undefined;

    if (typeof mergeDecisionsRaw === "string" && mergeDecisionsRaw.trim()) {
      try {
        mergeDecisions = JSON.parse(mergeDecisionsRaw) as Record<string, Record<string, "ARQUIVO" | "BANCO">>;
      } catch {
        return NextResponse.json({ error: "Formato inválido para decisões de merge" }, { status: 400 });
      }
    }

    const segmentoSlugRaw = formData.get("segmentoSlug");
    let segmentoId: number | undefined;
    if (typeof segmentoSlugRaw === "string" && segmentoSlugRaw.trim()) {
      const seg = await prisma.segmento.findUnique({
        where: { slug: segmentoSlugRaw.trim() },
        select: { id: true },
      });
      if (seg) segmentoId = seg.id;
    }

    // Carrega campos customizados para aliases dinâmicos na importação
    const camposCustom = await prisma.campoEmpresa.findMany({
      where: { builtin: false, visivel: true },
      select: { id: true, nome: true, label: true, tipo: true },
      orderBy: { ordem: "asc" },
    });

    const buffer = await file.arrayBuffer();
    const rows = await parseImportFile(buffer, camposCustom, { fileName: file.name, mimeType: file.type });

    if (!rows.length) {
      return NextResponse.json({ error: "Nenhuma linha encontrada no arquivo" }, { status: 400 });
    }

    const resultado = await importarEmpresasInteligente(rows, {
      mode,
      dryRun,
      usuarioRole: auth.session.user.role,
      mergeDecisions,
      camposCustom,
      segmentoId,
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
