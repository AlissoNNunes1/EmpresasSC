import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export function toCsv(rows: Record<string, string | number | null | undefined>[]): string {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | null | undefined) => {
    const normalized = value === null || value === undefined ? "" : String(value);
    return `"${normalized.replaceAll("\"", '""')}"`;
  };

  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(","));
  }

  return lines.join("\n");
}

export function toXlsxBuffer(rows: Record<string, string | number | null | undefined>[]): Uint8Array {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Empresas");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

export async function toPdfBuffer(rows: Record<string, string | number | null | undefined>[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText("Relatorio de Empresas", {
    x: 36,
    y: 560,
    size: 18,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  let y = 530;
  for (const row of rows.slice(0, 40)) {
    const line = `${row.razaoSocial ?? ""} | ${row.cnpj ?? ""} | ${row.bairro ?? ""} | ${row.numeroEmpregados ?? 0}`;
    page.drawText(line.slice(0, 130), {
      x: 36,
      y,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 14;
  }

  return pdfDoc.save();
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
