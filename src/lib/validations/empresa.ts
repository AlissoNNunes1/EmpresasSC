import { z } from "zod";

const enumPorte = z.enum(["MEI", "MICRO", "PEQUENA", "MEDIA", "GRANDE"]);
const enumSituacao = z.enum(["ATIVA", "INATIVA", "SUSPENSA", "ENCERRADA"]);
const enumTipo = z.enum(["PROPRIETARIO", "GERENTE", "RH"]);

const cpfSchema = z.string().regex(/^\d{11}$/, "CPF deve conter 11 digitos numericos");
const cnpjSchema = z.string().regex(/^\d{14}$/, "CNPJ deve conter 14 digitos numericos");

export const pessoaSchema = z.object({
  nome: z.string().min(3),
  tipo: enumTipo,
  cpf: cpfSchema,
  contato: z.string().min(8),
});

export const enderecoSchema = z.object({
  cep: z.string().regex(/^\d{8}$/, "CEP deve conter 8 digitos numericos"),
  bairro: z.string().min(2),
  logradouro: z.string().min(2),
});

export const empresaSchema = z.object({
  razaoSocial: z.string().min(3),
  nomeFantasia: z.string().optional(),
  cnpj: cnpjSchema,
  porte: enumPorte,
  categoriaId: z.number().int().positive(),
  atividadePrincipal: z.string().min(3),
  numeroEmpregados: z.number().int().nonnegative(),
  situacao: enumSituacao,
  endereco: enderecoSchema,
  responsaveis: z.array(pessoaSchema).min(1),
});

export const filtrosEmpresaSchema = z.object({
  categoriaId: z.coerce.number().int().positive().optional(),
  bairro: z.string().optional(),
  porte: enumPorte.optional(),
  situacao: enumSituacao.optional(),
  minEmpregados: z.coerce.number().int().nonnegative().optional(),
  maxEmpregados: z.coerce.number().int().nonnegative().optional(),
  termo: z.string().optional(),
});

export type EmpresaInput = z.infer<typeof empresaSchema>;
export type FiltrosEmpresaInput = z.infer<typeof filtrosEmpresaSchema>;

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
