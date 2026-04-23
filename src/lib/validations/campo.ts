import { z } from "zod";

export const TIPOS_CAMPO = ["TEXTO", "NUMERO", "SELECT", "TEXTAREA", "DATA"] as const;
export type TipoCampo = typeof TIPOS_CAMPO[number];

export const campoCreateSchema = z.object({
  nome: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Nome deve começar com letra e conter apenas letras, números e _"),
  label: z.string().min(1).max(80),
  tipo: z.enum(TIPOS_CAMPO),
  obrigatorio: z.boolean().default(false),
  opcoes: z.array(z.string().min(1)).optional(),
});

export const campoUpdateSchema = z.object({
  label: z.string().min(1).max(80).optional(),
  tipo: z.enum(TIPOS_CAMPO).optional(),
  obrigatorio: z.boolean().optional(),
  visivel: z.boolean().optional(),
  opcoes: z.array(z.string().min(1)).nullable().optional(),
});

export const campoReorderSchema = z.object({
  ids: z.array(z.number().int().positive()),
});

export type CampoCreateInput = z.infer<typeof campoCreateSchema>;
export type CampoUpdateInput = z.infer<typeof campoUpdateSchema>;

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
