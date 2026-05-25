import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import * as XLSX from "xlsx";

import type { FiltrosEmpresaInput } from "@/lib/validations/empresa";
import type { EmpresaRecord } from "@/types/empresa";

export type ExportValue = string | number | null | undefined;
export type ExportRow = Record<string, ExportValue>;

export type EmpresaExportContext = {
  sourceLabel: string;
  generatedAt: Date;
  totalRecords: number;
  filters?: FiltrosEmpresaInput;
};

export type EmpresaExportRow = {
  ID: number;
  "Razão Social": string;
  "Nome Fantasia": string;
  CNPJ: string;
  Categoria: string;
  Porte: string;
  Bairro: string;
  "Atividade Principal": string;
  "Número de Empregados": number;
  Situação: string;
};

const PDF_COLUMNS: Array<{ key: keyof EmpresaExportRow; label: string; width: number }> = [
  { key: "Razão Social", label: "Razão Social", width: 170 },
  { key: "CNPJ", label: "CNPJ", width: 100 },
  { key: "Categoria", label: "Categoria", width: 88 },
  { key: "Porte", label: "Porte", width: 62 },
  { key: "Bairro", label: "Bairro", width: 92 },
  { key: "Número de Empregados", label: "Empregados", width: 72 },
  { key: "Situação", label: "Situação", width: 82 },
];

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const NUMBER_FORMATTER = new Intl.NumberFormat("pt-BR");

export function buildEmpresaExportFilters(searchParams: URLSearchParams): FiltrosEmpresaInput {
  return {
    segmentoSlug: searchParams.get("segmentoSlug") ?? undefined,
    categoriaId: searchParams.get("categoriaId") ? Number(searchParams.get("categoriaId")) : undefined,
    bairro: searchParams.get("bairro") ?? undefined,
    porte: searchParams.get("porte") ?? undefined,
    situacao: searchParams.get("situacao") ?? undefined,
    minEmpregados: searchParams.get("minEmpregados") ? Number(searchParams.get("minEmpregados")) : undefined,
    maxEmpregados: searchParams.get("maxEmpregados") ? Number(searchParams.get("maxEmpregados")) : undefined,
    termo: searchParams.get("termo") ?? undefined,
  };
}

// Campos customizados visíveis são adicionados dinamicamente — sem hardcode
export function buildEmpresaExportRows(empresas: EmpresaRecord[]): ExportRow[] {
  return empresas.map((empresa) => {
    const baseRow: ExportRow = {
      ID: empresa.id,
      "Razão Social": empresa.razaoSocial,
      "Nome Fantasia": empresa.nomeFantasia ?? "",
      CNPJ: formatCnpj(empresa.cnpj),
      Segmento: (empresa as any).segmento?.nome ?? "",
      Categoria: empresa.categoria.nome,
      Porte: empresa.porte,
      Bairro: empresa.endereco?.bairro ?? "",
      Logradouro: empresa.endereco?.logradouro ?? "",
      CEP: empresa.endereco?.cep ?? "",
      "Atividade Principal": empresa.atividadePrincipal,
      "Número de Empregados": empresa.numeroEmpregados,
      Situação: empresa.situacao,
    };

    // Adiciona cada campo customizado como coluna — label do campo = cabeçalho da coluna
    for (const cv of empresa.camposCustom ?? []) {
      baseRow[cv.campo.label] = cv.valor;
    }

    return baseRow;
  });
}

export function buildEmpresaExportContext(params: {
  sourceLabel: string;
  totalRecords: number;
  filters?: FiltrosEmpresaInput;
  generatedAt?: Date;
}): EmpresaExportContext {
  return {
    sourceLabel: params.sourceLabel,
    totalRecords: params.totalRecords,
    filters: params.filters,
    generatedAt: params.generatedAt ?? new Date(),
  };
}

export function buildExportFilename(baseName: string, extension: string, generatedAt: Date): string {
  return `${slugify(baseName)}-${formatTimestampForFilename(generatedAt)}.${extension}`;
}

export function buildEmpresaExportFilename(baseName: string, extension: string, generatedAt: Date): string {
  return buildExportFilename(baseName, extension, generatedAt);
}

export function toCsv(rows: ExportRow[]): string {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const lines = ["sep=;"];

  if (headers.length > 0) {
    lines.push(headers.join(";"));

    for (const row of rows) {
      lines.push(headers.map((header) => escapeCsvCell(row[header])).join(";"));
    }
  }

  return `\uFEFF${lines.join("\r\n")}`;
}

export function toXlsxBuffer(rows: ExportRow[], context: EmpresaExportContext): Uint8Array {
  const workbook = XLSX.utils.book_new();
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const summarySheet = buildSummarySheet(context);
  const dataSheet = rows.length > 0
    ? XLSX.utils.json_to_sheet(rows, { header: headers, skipHeader: false })
    : XLSX.utils.aoa_to_sheet([headers]);

  if (headers.length > 0) {
    const range = XLSX.utils.decode_range(dataSheet["!ref"] ?? `A1:${XLSX.utils.encode_col(headers.length - 1)}1`);
    dataSheet["!autofilter"] = { ref: XLSX.utils.encode_range(range) };
  }

  dataSheet["!cols"] = buildColumnWidths(headers, rows);

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Empresas");

  return XLSX.write(workbook, { type: "array", bookType: "xlsx", compression: true });
}

export async function toPdfBuffer(rows: ExportRow[], context: EmpresaExportContext): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [842, 595];
  const margins = { left: 32, right: 32, top: 28, bottom: 30 };

  let page = pdfDoc.addPage(pageSize);
  let cursorY = drawPdfHeader(page, font, boldFont, context, margins);
  cursorY -= 18;

  cursorY = drawPdfTableHeader(page, font, boldFont, cursorY, margins);

  rows.forEach((row, index) => {
    const rowHeight = calculatePdfRowHeight(row, font);

    if (cursorY - rowHeight < margins.bottom) {
      page = pdfDoc.addPage(pageSize);
      cursorY = drawPdfHeader(page, font, boldFont, context, margins, false);
      cursorY -= 18;
      cursorY = drawPdfTableHeader(page, font, boldFont, cursorY, margins);
    }

    drawPdfRow(page, row, font, cursorY - rowHeight, rowHeight, margins, index);
    cursorY -= rowHeight;
  });

  return pdfDoc.save();
}

function buildSummarySheet(context: EmpresaExportContext): XLSX.WorkSheet {
  const filterRows = buildFilterRows(context.filters);
  const data = [
    [context.sourceLabel],
    [],
    ["Gerado em", formatDateTime(context.generatedAt)],
    ["Total de registros", context.totalRecords],
    [],
    ["Filtros aplicados"],
    ...filterRows,
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  sheet["!cols"] = [{ wch: 28 }, { wch: 62 }];
  return sheet;
}

function buildFilterRows(filters?: FiltrosEmpresaInput): Array<[string, string]> {
  if (!filters) {
    return [["Filtros", "Nenhum filtro aplicado"]];
  }

  const rows: Array<[string, string]> = [];

  if (filters.categoriaId) rows.push(["Categoria (ID)", String(filters.categoriaId)]);
  if (filters.bairro) rows.push(["Bairro", filters.bairro]);
  if (filters.porte) rows.push(["Porte", filters.porte]);
  if (filters.situacao) rows.push(["Situação", filters.situacao]);
  if (filters.minEmpregados !== undefined) rows.push(["Empregados mínimos", String(filters.minEmpregados)]);
  if (filters.maxEmpregados !== undefined) rows.push(["Empregados máximos", String(filters.maxEmpregados)]);
  if (filters.termo) rows.push(["Termo pesquisado", filters.termo]);

  return rows.length > 0 ? rows : [["Filtros", "Nenhum filtro aplicado"]];
}

function buildColumnWidths(headers: string[], rows: ExportRow[]): Array<{ wch: number }> {
  return headers.map((header) => {
    const baseWidth = header.length + 2;
    const maxContentWidth = rows.reduce((max, row) => Math.max(max, normalizeCell(row[header]).length), 0);
    return { wch: Math.min(Math.max(baseWidth, maxContentWidth + 2), 48) };
  });
}

function drawPdfHeader(
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  context: EmpresaExportContext,
  margins: { left: number; right: number; top: number; bottom: number },
  includeSummary = true,
): number {
  const pageWidth = page.getWidth();
  const usableWidth = pageWidth - margins.left - margins.right;
  const title = `Exportação de ${context.sourceLabel}`;

  page.drawRectangle({
    x: margins.left,
    y: page.getHeight() - margins.top - 52,
    width: usableWidth,
    height: 52,
    color: rgb(0.95, 0.97, 1),
    borderColor: rgb(0.79, 0.84, 0.93),
    borderWidth: 1,
  });

  page.drawText(title, {
    x: margins.left + 14,
    y: page.getHeight() - margins.top - 20,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.46),
  });

  page.drawText(`Gerado em ${formatDateTime(context.generatedAt)} • ${context.totalRecords} registros`, {
    x: margins.left + 14,
    y: page.getHeight() - margins.top - 38,
    size: 9,
    font,
    color: rgb(0.28, 0.33, 0.42),
  });

  if (!includeSummary) {
    return page.getHeight() - margins.top - 68;
  }

  const summaryLines = [
    `Origem: ${context.sourceLabel}`,
    ...formatFilterSummary(context.filters),
  ];

  const summaryText = summaryLines.join(" • ");
  const summaryY = page.getHeight() - margins.top - 72;

  page.drawText(summaryText, {
    x: margins.left,
    y: summaryY,
    size: 9,
    font,
    maxWidth: usableWidth,
    lineHeight: 11,
    color: rgb(0.23, 0.27, 0.33),
  });

  return summaryY - 16;
}

function drawPdfTableHeader(
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  y: number,
  margins: { left: number; right: number; top: number; bottom: number },
): number {
  const headerHeight = 24;
  let x = margins.left;

  for (const column of PDF_COLUMNS) {
    page.drawRectangle({
      x,
      y: y - headerHeight,
      width: column.width,
      height: headerHeight,
      color: rgb(0.89, 0.92, 0.97),
      borderColor: rgb(0.78, 0.82, 0.89),
      borderWidth: 0.8,
    });

    page.drawText(column.label, {
      x: x + 5,
      y: y - 16,
      size: 9,
      font: boldFont,
      color: rgb(0.13, 0.18, 0.28),
      maxWidth: column.width - 10,
    });

    x += column.width;
  }

  return y - headerHeight;
}

function drawPdfRow(
  page: PDFPage,
  row: ExportRow,
  font: PDFFont,
  rowY: number,
  rowHeight: number,
  margins: { left: number; right: number; top: number; bottom: number },
  index: number,
): void {
  let x = margins.left;
  const rowFill = index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.98, 0.99, 1);

  for (const column of PDF_COLUMNS) {
    page.drawRectangle({
      x,
      y: rowY,
      width: column.width,
      height: rowHeight,
      color: rowFill,
      borderColor: rgb(0.84, 0.87, 0.91),
      borderWidth: 0.6,
    });

    const lines = wrapText(font, normalizeCell(row[column.key]), 8.2, column.width - 10);
    lines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: x + 5,
        y: rowY + rowHeight - 12 - lineIndex * 9.2,
        size: 8.2,
        font,
        color: rgb(0.16, 0.18, 0.22),
        maxWidth: column.width - 10,
      });
    });

    x += column.width;
  }
}

function calculatePdfRowHeight(row: ExportRow, font: PDFFont): number {
  const maxLines = PDF_COLUMNS.reduce((max, column) => {
    const lines = wrapText(font, normalizeCell(row[column.key]), 8.2, column.width - 10);
    return Math.max(max, lines.length);
  }, 1);

  return Math.max(22, maxLines * 9.2 + 8);
}

function formatFilterSummary(filters?: FiltrosEmpresaInput): string[] {
  if (!filters) {
    return ["Filtros: nenhum"];
  }

  const parts: string[] = [];

  if (filters.categoriaId) parts.push(`Categoria (ID) ${filters.categoriaId}`);
  if (filters.bairro) parts.push(`Bairro ${filters.bairro}`);
  if (filters.porte) parts.push(`Porte ${filters.porte}`);
  if (filters.situacao) parts.push(`Situação ${filters.situacao}`);
  if (filters.minEmpregados !== undefined) parts.push(`Empregados mínimos ${NUMBER_FORMATTER.format(filters.minEmpregados)}`);
  if (filters.maxEmpregados !== undefined) parts.push(`Empregados máximos ${NUMBER_FORMATTER.format(filters.maxEmpregados)}`);
  if (filters.termo) parts.push(`Termo ${filters.termo}`);

  return parts.length > 0 ? [`Filtros: ${parts.join(" • ")}`] : ["Filtros: nenhum"];
}

function normalizeCell(value: ExportValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/\s+/g, " ").trim();
}

function escapeCsvCell(value: ExportValue): string {
  const normalized = normalizeCell(value).replace(/\r?\n/g, " ");
  return `"${normalized.replaceAll("\"", '""')}"`;
}

function formatDateTime(date: Date): string {
  return DATE_FORMATTER.format(date);
}

function formatTimestampForFilename(date: Date): string {
  return date
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 14) {
    return value;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function wrapText(font: PDFFont, text: string, fontSize: number, maxWidth: number): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [""];
  }

  const words = normalized.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }

    if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
      currentLine = word;
      continue;
    }

    let buffer = "";
    for (const character of word) {
      const nextBuffer = `${buffer}${character}`;
      if (font.widthOfTextAtSize(nextBuffer, fontSize) <= maxWidth) {
        buffer = nextBuffer;
      } else {
        if (buffer) {
          lines.push(buffer);
        }
        buffer = character;
      }
    }

    currentLine = buffer;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [normalized];
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
