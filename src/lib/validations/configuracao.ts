import { z } from "zod";

export const configuracaoSistemaSchema = z.object({
  nomeSistema: z.string().trim().min(3).max(120),
  nomeMunicipio: z.string().trim().min(3).max(120),
  logoUrl: z.url().max(300).nullable().optional(),
  emailInstitucional: z.email().max(160),
  minEmpregadosPequena: z.number().int().min(0).max(100000),
  maxEmpregadosPequena: z.number().int().min(0).max(100000),
  minEmpregadosMedia: z.number().int().min(0).max(100000),
  maxEmpregadosMedia: z.number().int().min(0).max(100000),
  categoriaPadraoId: z.number().int().positive().nullable().optional(),
  politicaSenhaMinCaracteres: z.number().int().min(6).max(64),
  tempoSessaoMinutos: z.number().int().min(15).max(1440),
  controleLoginAtivo: z.boolean(),
  integracaoCnpjAtiva: z.boolean(),
  webhookUrl: z.url().max(300).nullable().optional(),
});

export const categoriaCreateSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  status: z.enum(["ATIVO", "INATIVO"]),
});

export const categoriaUpdateSchema = z.object({
  nome: z.string().trim().min(2).max(100).optional(),
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
});

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
