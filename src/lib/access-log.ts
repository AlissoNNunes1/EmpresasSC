import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type RegisterLogInput = {
  usuarioId?: number;
  email?: string;
  rota: string;
  acao: string;
  request?: NextRequest;
};

export async function registerAccessLog(input: RegisterLogInput): Promise<void> {
  try {
    await prisma.logAcesso.create({
      data: {
        usuarioId: input.usuarioId,
        email: input.email,
        rota: input.rota,
        acao: input.acao,
        ip:
          input.request?.headers.get("x-forwarded-for") ??
          input.request?.headers.get("x-real-ip") ??
          undefined,
        userAgent: input.request?.headers.get("user-agent") ?? undefined,
      },
    });
  } catch (error) {
    console.error("Falha ao registrar log de acesso", error);
  }
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
