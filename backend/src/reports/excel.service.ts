import { Injectable } from "@nestjs/common";
import * as XLSX from "xlsx";

export interface ReportColumn {
  key: string;
  label_en: string;
  label_bn: string;
}

@Injectable()
export class ExcelService {
  generate(
    title: string,
    columns: ReportColumn[],
    rows: Record<string, unknown>[],
    lang: "en" | "bn",
  ): Buffer {
    const headers = columns.map((c) => (lang === "bn" ? c.label_bn : c.label_en));
    const data = rows.map((row) => columns.map((c) => row[c.key] ?? ""));

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Column widths based on header length
    ws["!cols"] = headers.map((h) => ({ wch: Math.max(String(h).length + 4, 14) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));

    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }
}
