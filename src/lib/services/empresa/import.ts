import * as XLSX from "xlsx";
import { PapelUsuario, PorteEmpresa, SituacaoEmpresa, TipoResponsavel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { onlyDigits } from "@/lib/utils";

type ImportMode = "UPSERT" | "CREATE_ONLY" | "UPDATE_ONLY";

type ImportOptions = {
  mode: ImportMode;
  dryRun: boolean;
  usuarioRole: PapelUsuario;
};

type ImportError = {
  linha: number;
  erro: string;
};

type ImportResult = {
  totalLinhas: number;
  processadas: number;
  criadas: number;
  atualizadas: number;
  ignoradas: number;
  erros: ImportError[];
};

type RowMap = {
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  categoria?: string;
  categoriaId?: string;
  atividadePrincipal?: string;
  numeroEmpregados?: string;
  porte?: string;
  situacao?: string;
  cep?: string;
  bairro?: string;
  logradouro?: string;
  responsavelNome?: string;
  responsavelCpf?: string;
  responsavelContato?: string;
  responsavelTipo?: string;
};

const HEADER_ALIASES: Record<keyof RowMap, string[]> = {
  razaoSocial: ["razaosocial", "razao social", "razao_social", "razao", "empresa", "nomeempresa"],
  nomeFantasia: ["nomefantasia", "nome fantasia", "fantasia"],
  cnpj: ["cnpj", "cnpjcpf"],
  categoria: ["categoria", "categorianome", "categoria nome"],
  categoriaId: ["categoriaid", "categoria id", "idcategoria"],
  atividadePrincipal: ["atividadeprincipal", "atividade principal", "atividade", "cnae"],
  numeroEmpregados: ["numeroempregados", "numero empregados", "empregados", "funcionarios", "qtdfuncionarios", "qtd empregados"],
  porte: ["porte"],
  situacao: ["situacao", "status"],
  cep: ["cep"],
  bairro: ["bairro"],
  logradouro: ["logradouro", "endereco", "rua"],
  responsavelNome: ["responsavel", "responsavelnome", "responsavel nome", "proprietario", "contatonome"],
  responsavelCpf: ["responsavelcpf", "responsavel cpf", "cpfresponsavel"],
  responsavelContato: ["responsavelcontato", "responsavel contato", "telefone", "contato"],
  responsavelTipo: ["responsaveltipo", "responsavel tipo", "tiporesponsavel"],
};

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function parseNumber(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? Math.max(0, Math.trunc(num)) : 0;
}

function parsePorte(value: string, empregados: number): PorteEmpresa {
  const raw = normalizeHeader(value).replace(/\s+/g, "");

  if (raw === "mei") return "MEI";
  if (raw === "micro") return "MICRO";
  if (raw === "pequena" || raw === "pequeno") return "PEQUENA";
  if (raw === "media" || raw === "medio") return "MEDIA";
  if (raw === "grande") return "GRANDE";

  // Classificação automática quando o porte não vem no arquivo.
  if (empregados <= 1) return "MEI";
  if (empregados <= 9) return "MICRO";
  if (empregados <= 49) return "PEQUENA";
  if (empregados <= 249) return "MEDIA";
  return "GRANDE";
}

function parseSituacao(value: string): SituacaoEmpresa {
  const raw = normalizeHeader(value).replace(/\s+/g, "");

  if (raw === "inativa" || raw === "inativo") return "INATIVA";
  if (raw === "suspensa" || raw === "suspenso") return "SUSPENSA";
  if (raw === "encerrada" || raw === "encerrado") return "ENCERRADA";
  return "ATIVA";
}

function parseResponsavelTipo(value: string): TipoResponsavel {
  const raw = normalizeHeader(value).replace(/\s+/g, "");

  if (raw === "gerente") return "GERENTE";
  if (raw === "rh") return "RH";
  return "PROPRIETARIO";
}

function mapRow(raw: Record<string, unknown>): RowMap {
  const mapped: RowMap = {};

  for (const [header, value] of Object.entries(raw)) {
    const normalized = normalizeHeader(header);
    const text = asString(value);

    if (!text) {
      continue;
    }

    for (const [target, aliases] of Object.entries(HEADER_ALIASES) as Array<[keyof RowMap, string[]]>) {
      if (aliases.includes(normalized)) {
        mapped[target] = text;
        break;
      }
    }
  }

  return mapped;
}

export function parseImportFile(buffer: ArrayBuffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  return rows;
}

async function resolveCategoriaId(row: RowMap): Promise<number> {
  if (row.categoriaId) {
    const id = Number(row.categoriaId);
    if (Number.isFinite(id) && id > 0) {
      const categoria = await prisma.categoria.findUnique({ where: { id } });
      if (categoria) {
        return categoria.id;
      }
    }
  }

  const nome = row.categoria?.trim();
  if (!nome) {
    throw new Error("Categoria ausente");
  }

  const existente = await prisma.categoria.findFirst({ where: { nome } });
  if (existente) {
    if (!existente.ativo) {
      await prisma.categoria.update({ where: { id: existente.id }, data: { ativo: true } });
    }
    return existente.id;
  }

  const created = await prisma.categoria.create({ data: { nome, ativo: true } });
  return created.id;
}

export async function importarEmpresasInteligente(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    totalLinhas: rows.length,
    processadas: 0,
    criadas: 0,
    atualizadas: 0,
    ignoradas: 0,
    erros: [],
  };

  if (options.usuarioRole === "VISUALIZADOR") {
    return {
      ...result,
      erros: [{ linha: 0, erro: "Perfil sem permissao para importar empresas" }],
    };
  }

  for (let i = 0; i < rows.length; i += 1) {
    const linha = i + 2;

    try {
      const mapped = mapRow(rows[i]);

      const razaoSocial = (mapped.razaoSocial ?? "").trim();
      const cnpj = onlyDigits(mapped.cnpj ?? "");

      if (!razaoSocial) {
        throw new Error("Razão social ausente");
      }

      if (cnpj.length !== 14) {
        throw new Error("CNPJ inválido (esperado 14 dígitos)");
      }

      const numeroEmpregados = parseNumber(mapped.numeroEmpregados ?? "0");
      const porte = parsePorte(mapped.porte ?? "", numeroEmpregados);
      const situacao = parseSituacao(mapped.situacao ?? "ATIVA");
      const categoriaId = await resolveCategoriaId(mapped);

      const responsavelNome = (mapped.responsavelNome ?? "Responsável não informado").trim();
      const responsavelCpf = onlyDigits(mapped.responsavelCpf ?? "").padStart(11, "0").slice(0, 11);
      const responsavelContato = (mapped.responsavelContato ?? "00000000").trim();
      const responsavelTipo = parseResponsavelTipo(mapped.responsavelTipo ?? "PROPRIETARIO");

      const payload = {
        razaoSocial,
        nomeFantasia: mapped.nomeFantasia?.trim() || null,
        cnpj,
        porte,
        categoriaId,
        atividadePrincipal: (mapped.atividadePrincipal ?? "Não informado").trim() || "Não informado",
        numeroEmpregados,
        situacao,
        endereco: {
          cep: onlyDigits(mapped.cep ?? "").padStart(8, "0").slice(0, 8),
          bairro: (mapped.bairro ?? "Não informado").trim() || "Não informado",
          logradouro: (mapped.logradouro ?? "Não informado").trim() || "Não informado",
        },
        responsavel: {
          nome: responsavelNome,
          tipo: responsavelTipo,
          cpf: responsavelCpf,
          contato: responsavelContato,
        },
      };

      const existente = await prisma.empresa.findUnique({ where: { cnpj } });

      if (options.mode === "CREATE_ONLY" && existente) {
        result.ignoradas += 1;
        continue;
      }

      if (options.mode === "UPDATE_ONLY" && !existente) {
        result.ignoradas += 1;
        continue;
      }

      if (options.dryRun) {
        if (existente) {
          result.atualizadas += 1;
        } else {
          result.criadas += 1;
        }
        result.processadas += 1;
        continue;
      }

      if (existente) {
        await prisma.$transaction(async (tx) => {
          await tx.pessoa.deleteMany({ where: { empresaId: existente.id } });

          await tx.empresa.update({
            where: { id: existente.id },
            data: {
              razaoSocial: payload.razaoSocial,
              nomeFantasia: payload.nomeFantasia,
              porte: payload.porte,
              categoriaId: payload.categoriaId,
              atividadePrincipal: payload.atividadePrincipal,
              numeroEmpregados: payload.numeroEmpregados,
              situacao: payload.situacao,
              endereco: {
                upsert: {
                  create: payload.endereco,
                  update: payload.endereco,
                },
              },
              responsaveis: {
                create: [payload.responsavel],
              },
            },
          });
        });

        result.atualizadas += 1;
      } else {
        await prisma.empresa.create({
          data: {
            razaoSocial: payload.razaoSocial,
            nomeFantasia: payload.nomeFantasia,
            cnpj: payload.cnpj,
            porte: payload.porte,
            categoriaId: payload.categoriaId,
            atividadePrincipal: payload.atividadePrincipal,
            numeroEmpregados: payload.numeroEmpregados,
            situacao: payload.situacao,
            endereco: { create: payload.endereco },
            responsaveis: { create: [payload.responsavel] },
          },
        });

        result.criadas += 1;
      }

      result.processadas += 1;
    } catch (error) {
      const erro = error instanceof Error ? error.message : "Falha desconhecida";
      result.erros.push({ linha, erro });
    }
  }

  return result;
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
