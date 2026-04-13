import { PapelUsuario } from "@prisma/client";
import { z } from "zod";

export const filtrosUsuarioSchema = z.object({
  termo: z.string().trim().min(1).max(120).optional(),
  role: z.nativeEnum(PapelUsuario).optional(),
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
});

export const usuarioCreateSchema = z.object({
  nome: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres").max(120),
  email: z.email("Email invalido").max(160),
  role: z.nativeEnum(PapelUsuario),
  status: z.enum(["ATIVO", "INATIVO"]),
  senha: z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(128),
});

export const usuarioUpdateSchema = z.object({
  nome: z.string().trim().min(3).max(120).optional(),
  email: z.email().max(160).optional(),
  role: z.nativeEnum(PapelUsuario).optional(),
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
  senha: z.string().min(8).max(128).optional(),
});

export const usuarioStatusSchema = z.object({
  status: z.enum(["ATIVO", "INATIVO"]),
});

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
