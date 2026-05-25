import { prisma } from "@/lib/prisma";
import { onlyDigits } from "@/lib/utils";
import { PapelUsuario, PorteEmpresa, SituacaoEmpresa, TipoResponsavel } from "@prisma/client";
import { createHash } from "node:crypto";
import * as XLSX from "xlsx";

type ImportMode = "UPSERT" | "CREATE_ONLY" | "UPDATE_ONLY";

export type CampoImportDef = { id: number; nome: string; label: string; tipo: string };

type ImportOptions = {
  mode: ImportMode;
  dryRun: boolean;
  usuarioRole: PapelUsuario;
  mergeDecisions?: Record<string, Record<string, "ARQUIVO" | "BANCO">>;
  camposCustom?: CampoImportDef[];  // campos customizados para aliases dinâmicos
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
  conflitos: MergeConflict[];
};

type MergeConflictField = {
  campo: string;
  valorArquivo: string;
  valorBanco: string;
};

type MergeConflict = {
  linha: number;
  cnpj: string;
  campos: MergeConflictField[];
};

type RowMap = {
  estabelecimento?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  categoria?: string;
  categoriaId?: string;
  atividadePrincipal?: string;
  numeroEmpregados?: string;
  numeroEmpregadosClt?: string;
  numeroEmpregadosFamilia?: string;
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
  estabelecimento: ["estabelecimento", "nome do estabelecimento", "nome estabelecimento", "nome"],
  razaoSocial: ["razaosocial", "razao social", "razao_social", "razao", "empresa", "nomeempresa", "nome empresarial", "denominacao", "razao social nome empresarial"],
  nomeFantasia: ["nomefantasia", "nome fantasia", "fantasia", "nome comercial", "nome de fantasia"],
  cnpj: ["cnpj", "cnpjcpf", "cnpj cpf", "cnpj cpf do socio", "documento", "doc", "inscricao", "nr documento", "numero documento"],
  categoria: ["categoria", "categorianome", "categoria nome", "setor", "ramo", "ramo de atividade", "segmento"],
  categoriaId: ["categoriaid", "categoria id", "idcategoria"],
  atividadePrincipal: ["atividadeprincipal", "atividade principal", "atividade", "cnae", "cnae principal", "descricao atividade", "descricao da atividade", "atividade economica"],
  numeroEmpregados: ["numeroempregados", "numero empregados", "empregados", "funcionarios", "qtdfuncionarios", "qtd empregados", "nr empregados", "no empregados", "n empregados", "total empregados", "total funcionarios", "qtd funcionarios", "quantidade funcionarios", "quantidade empregados", "nr funcionarios"],
  numeroEmpregadosClt: ["numero de empregados clt", "clt", "empregados clt", "funcionarios clt"],
  numeroEmpregadosFamilia: ["numero de empregados familia", "familia", "família", "empregados familia", "empregados família", "mao de obra familiar", "familiar"],
  porte: ["porte", "porte empresa", "tamanho", "classificacao", "classificacao porte"],
  situacao: ["situacao", "status", "situacao cadastral", "situacao da empresa", "ativo"],
  cep: ["cep", "codigo postal", "cod postal"],
  bairro: ["bairro", "bairro povoado", "bairro / povoado", "bairro localidade", "localidade"],
  logradouro: ["logradouro", "endereco", "rua", "endereço", "rua av", "rua avenida", "logradouro numero", "logradouro e numero"],
  responsavelNome: ["responsavel", "responsavelnome", "responsavel nome", "proprietario", "contatonome", "proprietario gerente rh", "proprietario / gerente / rh", "socio", "nome do socio", "representante", "nome representante"],
  responsavelCpf: ["responsavelcpf", "responsavel cpf", "cpfresponsavel", "cpf socio", "cpf do socio", "cpf representante"],
  responsavelContato: ["responsavelcontato", "responsavel contato", "telefone", "contato", "celular", "fone", "tel", "whatsapp", "email", "e-mail"],
  responsavelTipo: ["responsaveltipo", "responsavel tipo", "tiporesponsavel", "tipo socio", "cargo"],
};

// ── similaridade de bigrama (Dice) ────────────────────────────────────────────
// Usada como fallback quando não há correspondência exata nos aliases.

function bigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigrams = (s: string): Map<string, number> => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      m.set(bg, (m.get(bg) ?? 0) + 1);
    }
    return m;
  };

  const bA = bigrams(a);
  const bB = bigrams(b);
  let inter = 0;
  for (const [bg, cnt] of bA) inter += Math.min(cnt, bB.get(bg) ?? 0);
  return (2 * inter) / (a.length - 1 + (b.length - 1));
}

const FUZZY_THRESHOLD = 0.72;

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\//g, " ")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSemanticValue(value: string): string {
  return normalizeHeader(value);
}

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function mergeHeaderParts(...parts: Array<string | undefined>): string {
  return parts
    .filter((part) => Boolean(part && part.trim()))
    .map((part) => part!.trim())
    .join(" ")
    .trim();
}

function normalizeCellText(value: unknown): string {
  return normalizeHeader(asString(value));
}

function normalizeSheetHeader(value: unknown): string {
  return normalizeCellText(value);
}

function parseNumber(value: string): number {
  // Ignora valores não numéricos comuns em planilhas
  const cleaned = value.trim();
  if (!cleaned || /^[-–—nN\/\s]+$/.test(cleaned)) return 0;
  // Detecta se o separador decimal é vírgula ou ponto
  const hasBothSeparators = cleaned.includes(".") && cleaned.includes(",");
  const normalized = hasBothSeparators
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned.replace(",", ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? Math.max(0, Math.trunc(num)) : 0;
}

// Mapa de abreviações legais brasileiras e sinônimos comuns de porte
const PORTE_MAP: Record<string, PorteEmpresa> = {
  mei: "MEI",
  "microempreendedor individual": "MEI",
  ei: "MEI",       // Empresário Individual (sem empregados → MEI)
  eia: "MEI",
  me: "MICRO",     // Microempresa
  micro: "MICRO",
  microempresa: "MICRO",
  epp: "PEQUENA",  // Empresa de Pequeno Porte
  pequena: "PEQUENA",
  pequeno: "PEQUENA",
  "empresa de pequeno porte": "PEQUENA",
  media: "MEDIA",
  medio: "MEDIA",
  "empresa de medio porte": "MEDIA",
  grande: "GRANDE",
  ge: "GRANDE",    // Grande Empresa
  eg: "GRANDE",
  "empresa de grande porte": "GRANDE",
};

function parsePorte(value: string, empregados: number): PorteEmpresa {
  const raw = normalizeHeader(value).replace(/\s+/g, "");
  const rawFull = normalizeHeader(value);

  const fromMap = PORTE_MAP[raw] ?? PORTE_MAP[rawFull];
  if (fromMap) return fromMap;

  // Classificação automática pelo número de empregados
  if (empregados === 0) return "MEI";
  if (empregados <= 9) return "MICRO";
  if (empregados <= 49) return "PEQUENA";
  if (empregados <= 249) return "MEDIA";
  return "GRANDE";
}

function parseSituacao(value: string): SituacaoEmpresa {
  const raw = normalizeHeader(value).replace(/\s+/g, "");

  if (["inativa", "inativo", "0", "false", "nao", "nao ativa"].includes(raw)) return "INATIVA";
  if (["suspensa", "suspenso", "suspensao"].includes(raw)) return "SUSPENSA";
  if (["encerrada", "encerrado", "baixada", "baixado", "cancelada"].includes(raw)) return "ENCERRADA";
  return "ATIVA";
}

function parseResponsavelTipo(value: string): TipoResponsavel {
  const raw = normalizeHeader(value).replace(/\s+/g, "");

  if (["gerente", "gestor", "diretor", "administrador"].includes(raw)) return "GERENTE";
  if (["rh", "recursos humanos", "rh dp"].includes(raw)) return "RH";
  return "PROPRIETARIO";
}

// ── validação de CNPJ (dígitos verificadores) ─────────────────────────────────

function isValidCnpj(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calc = (s: string, weights: number[]) => {
    const sum = weights.reduce((acc, w, i) => acc + w * Number(s[i]), 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };
  const d1 = calc(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

// Chave usada no RowMap para campos customizados: "customcampo_<id>"
function customCampoKey(id: number): string {
  return `customcampo_${id}`;
}

function mapRow(raw: Record<string, unknown>, camposCustom: CampoImportDef[] = []): RowMap {
  const mapped: RowMap = {};

  for (const [header, value] of Object.entries(raw)) {
    const normalized = normalizeHeader(header);
    const text = asString(value);

    if (!text) continue;

    // 1. Correspondência exata nos aliases
    let matched = false;
    for (const [target, aliases] of Object.entries(HEADER_ALIASES) as Array<[keyof RowMap, string[]]>) {
      if (aliases.includes(normalized)) {
        mapped[target] = text;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 2. Correspondência fuzzy (bigrama Dice ≥ threshold) como fallback
    let bestTarget: keyof RowMap | null = null;
    let bestScore = 0;
    for (const [target, aliases] of Object.entries(HEADER_ALIASES) as Array<[keyof RowMap, string[]]>) {
      for (const alias of aliases) {
        const score = bigramSimilarity(normalized, alias);
        if (score >= FUZZY_THRESHOLD && score > bestScore) {
          bestScore = score;
          bestTarget = target as keyof RowMap;
        }
      }
    }
    if (bestTarget && !mapped[bestTarget]) {
      mapped[bestTarget] = text;
      continue;
    }

    // 3. Campos customizados dinâmicos — label e nome do banco como aliases
    for (const campo of camposCustom) {
      const campoAliases = [
        normalizeHeader(campo.label),
        normalizeHeader(campo.nome),
      ];
      const key = customCampoKey(campo.id);
      if (campoAliases.includes(normalized) || campoAliases.some((a) => bigramSimilarity(normalized, a) >= FUZZY_THRESHOLD)) {
        (mapped as Record<string, string>)[key] = text;
        break;
      }
    }
  }

  // 3. Fallback: razaoSocial → estabelecimento e vice-versa
  if (!mapped.razaoSocial && mapped.estabelecimento) mapped.razaoSocial = mapped.estabelecimento;
  if (!mapped.estabelecimento && mapped.razaoSocial) mapped.estabelecimento = mapped.razaoSocial;
  if (!mapped.nomeFantasia && mapped.razaoSocial) mapped.nomeFantasia = mapped.razaoSocial;

  return mapped;
}

type ParsedSheetRow = Record<string, unknown>;

function isLikelyHeaderRow(row: unknown[]): boolean {
  const normalizedCells = row.map((cell) => normalizeSheetHeader(cell));

  const hasEstabelecimento = normalizedCells.includes("estabelecimento");
  const hasRazaoSocial = normalizedCells.some((c) =>
    ["razao social", "razaosocial", "razao", "empresa", "nomeempresa"].includes(c)
  );
  const hasDocumento =
    normalizedCells.includes("cnpj cpf") ||
    normalizedCells.includes("cnpj") ||
    normalizedCells.includes("cpf");
  const hasAtividade =
    normalizedCells.includes("atividade principal") ||
    normalizedCells.includes("atividade") ||
    normalizedCells.includes("cnae");

  // Formato completo (planilha municipal): estabelecimento + documento + atividade
  if (hasEstabelecimento && hasDocumento && hasAtividade) return true;

  // Formato simplificado: razão social (ou estabelecimento) + documento
  if ((hasRazaoSocial || hasEstabelecimento) && hasDocumento) return true;

  return false;
}

function findHeaderRowIndex(matrix: unknown[][]): number {
  for (let i = 0; i < matrix.length; i += 1) {
    if (isLikelyHeaderRow(matrix[i])) {
      return i;
    }
  }

  return -1;
}

function hasCltFamiliaSubheader(row: unknown[]): boolean {
  const normalizedCells = row.map((cell) => normalizeSheetHeader(cell));
  return normalizedCells.includes("clt") || normalizedCells.includes("familia");
}

function getRowNumberValue(row: ParsedSheetRow): string {
  return asString(row["nº"] ?? row["no"] ?? row["n"] ?? row["numero"] ?? row["n o"] ?? "");
}

function hasRowNumberColumn(row: ParsedSheetRow): boolean {
  const keys = Object.keys(row);
  return keys.includes("nº") || keys.includes("no") || keys.includes("n") || keys.includes("numero") || keys.includes("n o");
}

function isLikelyDataRow(row: ParsedSheetRow): boolean {
  const estabelecimento = asString(row.estabelecimento ?? row["estabelecimento"] ?? "");
  const razaoSocial = asString(row["razao social"] ?? row["razaosocial"] ?? row["razao"] ?? row["empresa"] ?? "");
  const atividade = asString(row["atividade principal"] ?? row["atividade"] ?? "");
  const documento = asString(row["cnpj cpf"] ?? row["cnpj"] ?? row["cpf"] ?? "");
  const endereco = asString(row.endereco ?? row["endereco"] ?? "");
  const bairro = asString(row["bairro povoado"] ?? row.bairro ?? "");
  const numeroLinha = getRowNumberValue(row);
  const possuiColunaNumero = hasRowNumberColumn(row);

  // Ignora linhas de subtotal/resumo quando a planilha possui coluna de numeração.
  if (possuiColunaNumero && !/^\d+$/.test(numeroLinha)) {
    return false;
  }

  const hasMainFields = Boolean(estabelecimento || razaoSocial || atividade || documento || endereco || bairro);
  if (!hasMainFields) {
    return false;
  }

  // Evita subtotal por bairro onde "estabelecimento" vira um número e não há documento.
  const mainName = estabelecimento || razaoSocial;
  if (/^\d+$/.test(mainName) && !onlyDigits(documento)) {
    return false;
  }

  const normalizedMain = normalizeSemanticValue(mainName);
  if (
    normalizedMain === "total" ||
    normalizedMain === "povoados" ||
    normalizedMain === "centro historico" ||
    normalizedMain === "grande rosa elze"
  ) {
    return false;
  }

  return true;
}

function buildRowFromSheetHeaders(headers: string[], values: unknown[]): ParsedSheetRow {
  const row: ParsedSheetRow = {};

  headers.forEach((header, index) => {
    const key = header?.trim();
    if (!key) {
      return;
    }

    row[key] = values[index] ?? "";
  });

  return row;
}

function extractRowsFromSheet(sheet: XLSX.WorkSheet): ParsedSheetRow[] {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });

  if (matrix.length === 0) {
    return [];
  }

  const headerIndex = findHeaderRowIndex(matrix);
  if (headerIndex < 0) {
    return [];
  }

  const topHeaderRow = matrix[headerIndex] ?? [];
  const secondRow = matrix[headerIndex + 1] ?? [];
  const useSecondHeader = hasCltFamiliaSubheader(secondRow);
  const bodyStartIndex = headerIndex + (useSecondHeader ? 2 : 1);
  const bodyRows = matrix.slice(bodyStartIndex);

  const headers = topHeaderRow.map((cell, index) => {
    const top = normalizeSheetHeader(cell);
    const bottom = useSecondHeader ? normalizeSheetHeader(secondRow[index]) : "";
    const merged = mergeHeaderParts(top, bottom);

    return merged || top || bottom || `coluna_${index + 1}`;
  });

  return bodyRows
    .filter((row) => Array.isArray(row) && row.some((cell) => asString(cell).trim()))
    .map((row) => buildRowFromSheetHeaders(headers, row as unknown[]))
    .filter((row) => isLikelyDataRow(row));
}

// ── auto-detecção de coluna CNPJ por conteúdo ────────────────────────────────
// Se nenhuma coluna do cabeçalho foi reconhecida como CNPJ, varre as colunas
// e elege a que tem mais valores com 11 ou 14 dígitos.

function inferCnpjColumn(rows: ParsedSheetRow[]): string | null {
  if (!rows.length) return null;

  const candidates = Object.keys(rows[0]);
  const scores: Record<string, number> = {};

  for (const col of candidates) {
    let hits = 0;
    for (const row of rows.slice(0, 20)) {
      const d = onlyDigits(asString(row[col]));
      if (d.length === 14 || d.length === 11) hits++;
    }
    scores[col] = hits;
  }

  const best = candidates.reduce((a, b) => (scores[a] >= scores[b] ? a : b), candidates[0]);
  return best && scores[best] >= 2 ? best : null;
}

function applyFallbackCnpjColumn(rows: ParsedSheetRow[]): ParsedSheetRow[] {
  // Verifica se alguma linha já tem a chave "cnpj" preenchida
  const alreadyMapped = rows.some((r) => asString(r["cnpj"]).trim());
  if (alreadyMapped) return rows;

  const col = inferCnpjColumn(rows);
  if (!col || col === "cnpj") return rows;

  return rows.map((row) => ({ ...row, cnpj: row[col] }));
}

export function parseImportFile(buffer: ArrayBuffer, camposCustom: CampoImportDef[] = []): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false, raw: false });
  const allRows: ParsedSheetRow[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const sheetRows = extractRowsFromSheet(sheet);
    allRows.push(...applyFallbackCnpjColumn(sheetRows));
  }

  // Aplica mapeamento de campos customizados a cada linha
  return allRows.map((row) => {
    const mapped = mapRow(row as Record<string, unknown>, camposCustom);
    return { ...row, ...mapped };
  });
}

type CategoriaCacheItem = {
  id: number;
  nome: string;
  ativo: boolean;
};

type CategoriaCache = {
  byId: Map<number, CategoriaCacheItem>;
  byCanonical: Map<string, CategoriaCacheItem>;
  tempId: number;
};

function registerCategoriaInCache(cache: CategoriaCache, categoria: CategoriaCacheItem): void {
  cache.byId.set(categoria.id, categoria);
  cache.byCanonical.set(normalizeSemanticValue(categoria.nome), categoria);
}

async function buildCategoriaCache(): Promise<CategoriaCache> {
  const categorias = await prisma.categoria.findMany();
  const cache: CategoriaCache = {
    byId: new Map(),
    byCanonical: new Map(),
    tempId: -1,
  };

  for (const categoria of categorias) {
    registerCategoriaInCache(cache, {
      id: categoria.id,
      nome: categoria.nome,
      ativo: categoria.ativo,
    });
  }

  return cache;
}

async function resolveCategoriaId(row: RowMap, cache: CategoriaCache, dryRun: boolean): Promise<number> {
  if (row.categoriaId) {
    const id = Number(row.categoriaId);
    if (Number.isFinite(id) && id > 0) {
      const categoria = cache.byId.get(id);
      if (categoria) {
        if (!categoria.ativo && !dryRun) {
          await prisma.categoria.update({ where: { id: categoria.id }, data: { ativo: true } });
          categoria.ativo = true;
        }
        return categoria.id;
      }
    }
  }

  const nome = resolveCategoriaNome(row);

  const nomeCanonical = normalizeSemanticValue(nome);
  const existente = cache.byCanonical.get(nomeCanonical);
  if (existente) {
    if (!existente.ativo && !dryRun) {
      await prisma.categoria.update({ where: { id: existente.id }, data: { ativo: true } });
      existente.ativo = true;
    }
    return existente.id;
  }

  if (dryRun) {
    const virtual = {
      id: cache.tempId,
      nome,
      ativo: true,
    };
    cache.tempId -= 1;
    registerCategoriaInCache(cache, virtual);
    return virtual.id;
  }

  const created = await prisma.categoria.create({ data: { nome, ativo: true } });
  registerCategoriaInCache(cache, {
    id: created.id,
    nome: created.nome,
    ativo: created.ativo,
  });
  return created.id;
}

function valueToText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function inferResponsavelTipo(value: string): TipoResponsavel {
  const normalized = normalizeSemanticValue(value);

  if (normalized.includes("gerente")) return "GERENTE";
  if (normalized.includes("rh")) return "RH";
  if (normalized.includes("proprietario") || normalized.includes("proprietária") || normalized.includes("proprietario")) {
    return "PROPRIETARIO";
  }

  return "PROPRIETARIO";
}

function parseNumeroEmpregados(row: RowMap): number {
  const clt = parseNumber(row.numeroEmpregadosClt ?? row.numeroEmpregados ?? "0");
  const familia = parseNumber(row.numeroEmpregadosFamilia ?? "0");
  const total = clt + familia;

  if (total > 0) {
    return total;
  }

  return parseNumber(row.numeroEmpregados ?? "0");
}

function parseDocumentoFiscal(value: string): string | null {
  const raw = normalizeSemanticValue(value);

  const AUSENTE = ["sem cnpj", "sem cpf", "nao possui", "nao informado", "s n", "sn", "n a", "na", "-", "", "0"];
  if (AUSENTE.includes(raw)) return null;

  let digits = onlyDigits(value);

  // Excel às vezes armazena CNPJ como número e remove zeros à esquerda.
  // Ex.: "19577407000104" vira 19577407000104 (14 dígitos — OK)
  //      "4477000100" pode vir de "00.044.770/0001-00" → pad para 14
  if (digits.length > 0 && digits.length < 11) {
    // Tenta recuperar como CNPJ com zeros à esquerda
    const padded = digits.padStart(14, "0");
    if (isValidCnpj(padded)) return padded;
  }

  // CNPJ com um zero extra no início (planilhas legadas)
  if (digits.length === 15 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 14) {
    // Aceita mesmo se inválido (ex.: CNPJs legados ou mal digitados) — avisa via log mas importa
    return digits;
  }

  if (digits.length === 11) return digits; // CPF

  return null;
}

function buildFallbackDocumentoFiscal(row: RowMap): string {
  const signature = [
    row.estabelecimento,
    row.razaoSocial,
    row.nomeFantasia,
    row.atividadePrincipal,
    row.logradouro,
    row.bairro,
    row.responsavelNome,
    row.responsavelContato,
    row.porte,
    row.situacao,
    row.numeroEmpregadosClt,
    row.numeroEmpregadosFamilia,
  ]
    .map((part) => normalizeSemanticValue(part ?? ""))
    .filter((part) => Boolean(part))
    .join("|");

  const hash = createHash("sha256").update(signature || "sem-identificacao").digest("hex");
  const numeric = parseInt(hash.slice(0, 12), 16) % 100000000000000;

  return numeric.toString().padStart(14, "0");
}

export function resolveDocumentoFiscal(row: RowMap): { documento: string; origem: "CPF" | "CNPJ" | "SINTETICO" } {
  const bruto = row.cnpj ?? "";
  const documento = parseDocumentoFiscal(bruto);

  if (documento) {
    return {
      documento,
      origem: documento.length === 11 ? "CPF" : "CNPJ",
    };
  }

  return {
    documento: buildFallbackDocumentoFiscal(row),
    origem: "SINTETICO",
  };
}

export function resolveCategoriaNome(row: RowMap): string {
  const candidato = row.categoria?.trim() || row.atividadePrincipal?.trim() || row.estabelecimento?.trim() || "";

  if (!candidato) {
    throw new Error("Categoria ausente");
  }

  return candidato;
}

function resolveRazaoSocial(row: RowMap, cnpj: string): string {
  const candidato =
    row.razaoSocial?.trim() ||
    row.estabelecimento?.trim() ||
    row.nomeFantasia?.trim() ||
    (cnpj ? `Empresa ${cnpj}` : "Empresa sem razão social");

  return candidato.trim() || "Empresa sem razão social";
}

function isSameText(a: unknown, b: unknown): boolean {
  return normalizeSemanticValue(valueToText(a)) === normalizeSemanticValue(valueToText(b));
}

function isSameDigits(a: unknown, b: unknown): boolean {
  return onlyDigits(valueToText(a)) === onlyDigits(valueToText(b));
}

type MergePayload = {
  razaoSocial: string;
  nomeFantasia: string | null;
  porte: PorteEmpresa;
  categoriaId: number;
  atividadePrincipal: string;
  numeroEmpregados: number;
  situacao: SituacaoEmpresa;
  endereco: {
    cep: string;
    bairro: string;
    logradouro: string;
  };
  responsavel: {
    nome: string;
    tipo: TipoResponsavel;
    cpf: string;
    contato: string;
  };
};

function mergeValueByDecision<T>(
  decision: "ARQUIVO" | "BANCO" | undefined,
  fileValue: T,
  dbValue: T
): T {
  if (decision === "BANCO") {
    return dbValue;
  }
  return fileValue;
}

function applyMergeDecisions(
  cnpj: string,
  payload: MergePayload,
  existente: {
    razaoSocial: string;
    nomeFantasia: string | null;
    porte: PorteEmpresa;
    categoriaId: number;
    atividadePrincipal: string;
    numeroEmpregados: number;
    situacao: SituacaoEmpresa;
    endereco: { cep: string; bairro: string; logradouro: string } | null;
    responsaveis: Array<{ nome: string; tipo: TipoResponsavel; cpf: string; contato: string }>;
  },
  categoriaCache: CategoriaCache,
  mergeDecisions?: Record<string, Record<string, "ARQUIVO" | "BANCO">>
): { payload: MergePayload; conflitos: MergeConflictField[] } {
  const decisionsByCnpj = mergeDecisions?.[cnpj] ?? {};
  const conflitos: MergeConflictField[] = [];
  const firstResponsavel = existente.responsaveis[0] ?? null;
  const categoriaArquivo = categoriaCache.byId.get(payload.categoriaId)?.nome ?? String(payload.categoriaId);
  const categoriaBanco = categoriaCache.byId.get(existente.categoriaId)?.nome ?? String(existente.categoriaId);

  const nextPayload: MergePayload = {
    ...payload,
    endereco: { ...payload.endereco },
    responsavel: { ...payload.responsavel },
  };

  const handleConflict = <T>(
    campo: string,
    fileValue: T,
    dbValue: T,
    sameCheck: (a: T, b: T) => boolean,
    apply: (value: T) => void
  ) => {
    if (sameCheck(fileValue, dbValue)) {
      return;
    }

    const decision = decisionsByCnpj[campo];
    if (!decision) {
      conflitos.push({
        campo,
        valorArquivo: valueToText(fileValue),
        valorBanco: valueToText(dbValue),
      });
      return;
    }

    const merged = mergeValueByDecision(decision, fileValue, dbValue);
    apply(merged);
  };

  handleConflict("razaoSocial", payload.razaoSocial, existente.razaoSocial, isSameText, (value) => {
    nextPayload.razaoSocial = value;
  });
  handleConflict("nomeFantasia", payload.nomeFantasia ?? "", existente.nomeFantasia ?? "", isSameText, (value) => {
    nextPayload.nomeFantasia = value || null;
  });
  handleConflict("atividadePrincipal", payload.atividadePrincipal, existente.atividadePrincipal, isSameText, (value) => {
    nextPayload.atividadePrincipal = value;
  });
  handleConflict("numeroEmpregados", payload.numeroEmpregados, existente.numeroEmpregados, (a, b) => a === b, (value) => {
    nextPayload.numeroEmpregados = value;
  });
  handleConflict("porte", payload.porte, existente.porte, (a, b) => a === b, (value) => {
    nextPayload.porte = value;
  });
  handleConflict("situacao", payload.situacao, existente.situacao, (a, b) => a === b, (value) => {
    nextPayload.situacao = value;
  });
  handleConflict("categoria", categoriaArquivo, categoriaBanco, isSameText, (value) => {
    const canonical = normalizeSemanticValue(value);
    const categoria = categoriaCache.byCanonical.get(canonical);
    if (categoria) {
      nextPayload.categoriaId = categoria.id;
    }
  });

  const enderecoBanco = existente.endereco ?? { cep: "", bairro: "", logradouro: "" };
  handleConflict("cep", payload.endereco.cep, enderecoBanco.cep, isSameDigits, (value) => {
    nextPayload.endereco.cep = onlyDigits(value).padStart(8, "0").slice(0, 8);
  });
  handleConflict("bairro", payload.endereco.bairro, enderecoBanco.bairro, isSameText, (value) => {
    nextPayload.endereco.bairro = value;
  });
  handleConflict("logradouro", payload.endereco.logradouro, enderecoBanco.logradouro, isSameText, (value) => {
    nextPayload.endereco.logradouro = value;
  });

  const responsavelBanco = firstResponsavel ?? {
    nome: "",
    tipo: "PROPRIETARIO" as TipoResponsavel,
    cpf: "",
    contato: "",
  };
  handleConflict("responsavelNome", payload.responsavel.nome, responsavelBanco.nome, isSameText, (value) => {
    nextPayload.responsavel.nome = value;
  });
  handleConflict("responsavelTipo", payload.responsavel.tipo, responsavelBanco.tipo, (a, b) => a === b, (value) => {
    nextPayload.responsavel.tipo = value;
  });
  handleConflict("responsavelCpf", payload.responsavel.cpf, responsavelBanco.cpf, isSameDigits, (value) => {
    nextPayload.responsavel.cpf = onlyDigits(value).padStart(11, "0").slice(0, 11);
  });
  handleConflict("responsavelContato", payload.responsavel.contato, responsavelBanco.contato, isSameText, (value) => {
    nextPayload.responsavel.contato = value;
  });

  if (conflitos.length > 0) {
    return {
      payload,
      conflitos,
    };
  }

  return { payload: nextPayload, conflitos: [] };
}

export async function importarEmpresasInteligente(
  rows: Record<string, unknown>[],
  options: ImportOptions,
): Promise<ImportResult> {
  const camposCustomDefs = options.camposCustom ?? [];
  const result: ImportResult = {
    totalLinhas: rows.length,
    processadas: 0,
    criadas: 0,
    atualizadas: 0,
    ignoradas: 0,
    erros: [],
    conflitos: [],
  };

  if (options.usuarioRole === "VISUALIZADOR") {
    return {
      ...result,
      erros: [{ linha: 0, erro: "Perfil sem permissao para importar empresas" }],
    };
  }

  const categoriaCache = await buildCategoriaCache();
  const seenCnpjByLine = new Map<string, number>();

  for (let i = 0; i < rows.length; i += 1) {
    const linha = i + 2;

    try {
      const rawRow = rows[i] as Record<string, unknown>;
      const mapped = mapRow(rawRow, camposCustomDefs);

      // Extrai valores de campos customizados presentes na linha
      const valoresCamposCustom: Array<{ campoId: number; valor: string }> = [];
      for (const campo of camposCustomDefs) {
        const key = customCampoKey(campo.id);
        const valor = asString(rawRow[key] ?? (mapped as Record<string, unknown>)[key]);
        if (valor.trim()) {
          valoresCamposCustom.push({ campoId: campo.id, valor: valor.trim() });
        }
      }

      const documentoFiscal = resolveDocumentoFiscal(mapped);
      const cnpj = documentoFiscal.documento;
      const razaoSocial = resolveRazaoSocial(mapped, cnpj);

      const firstSeenLine = seenCnpjByLine.get(cnpj);
      if (firstSeenLine) {
        throw new Error(`CNPJ duplicado no arquivo (primeira ocorrencia na linha ${firstSeenLine})`);
      }
      seenCnpjByLine.set(cnpj, linha);

      const numeroEmpregados = parseNumeroEmpregados(mapped);
      const porte = parsePorte(mapped.porte ?? "", numeroEmpregados);
      const situacao = parseSituacao(mapped.situacao ?? "ATIVA");
      const categoriaId = await resolveCategoriaId(mapped, categoriaCache, options.dryRun);

      const responsavelNome = (mapped.responsavelNome ?? "Responsável não informado").trim();
      const responsavelCpf = onlyDigits(mapped.responsavelCpf ?? "").padStart(11, "0").slice(0, 11);
      const responsavelContato = (mapped.responsavelContato ?? "00000000").trim();
      const responsavelTipo = mapped.responsavelTipo ? parseResponsavelTipo(mapped.responsavelTipo) : inferResponsavelTipo(responsavelNome);

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

      const existente = await prisma.empresa.findUnique({
        where: { cnpj },
        include: {
          endereco: true,
          responsaveis: { orderBy: { id: "asc" }, take: 1 },
        },
      });

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
          const merge = applyMergeDecisions(cnpj, payload, existente, categoriaCache, options.mergeDecisions);
          if (merge.conflitos.length > 0) {
            result.conflitos.push({ linha, cnpj, campos: merge.conflitos });
            result.ignoradas += 1;
            continue;
          }
        }

        if (existente) {
          result.atualizadas += 1;
        } else {
          result.criadas += 1;
        }
        result.processadas += 1;
        continue;
      }

      if (existente) {
        const merge = applyMergeDecisions(cnpj, payload, existente, categoriaCache, options.mergeDecisions);
        if (merge.conflitos.length > 0) {
          result.conflitos.push({ linha, cnpj, campos: merge.conflitos });
          result.ignoradas += 1;
          continue;
        }

        await prisma.$transaction(async (tx) => {
          await tx.pessoa.deleteMany({ where: { empresaId: existente.id } });

          await tx.empresa.update({
            where: { id: existente.id },
            data: {
              razaoSocial: merge.payload.razaoSocial,
              nomeFantasia: merge.payload.nomeFantasia,
              porte: merge.payload.porte,
              categoriaId: merge.payload.categoriaId,
              atividadePrincipal: merge.payload.atividadePrincipal,
              numeroEmpregados: merge.payload.numeroEmpregados,
              situacao: merge.payload.situacao,
              endereco: {
                upsert: {
                  create: merge.payload.endereco,
                  update: merge.payload.endereco,
                },
              },
              responsaveis: {
                create: [merge.payload.responsavel],
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
            // Campos customizados importados dinamicamente
            camposCustom: valoresCamposCustom.length > 0
              ? { create: valoresCamposCustom }
              : undefined,
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
