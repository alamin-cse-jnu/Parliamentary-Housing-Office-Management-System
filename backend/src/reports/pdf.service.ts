import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import type { ReportColumn } from "./excel.service";

// pdfmake 0.3.x: PdfPrinter + URLResolver (urlResolver is required since 0.3.x)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require("pdfmake/js/Printer").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const URLResolver = require("pdfmake/js/URLResolver").default;

const ASSETS_DIR = path.join(process.cwd(), "assets");
const FONTS_DIR  = path.join(ASSETS_DIR, "fonts");
const LOGO_PATH  = path.join(ASSETS_DIR, "parliament-logo.png");

const LATIN_FONT   = "Roboto";
const BENGALI_FONT = "NotoSansBengali";

// ── Per-segment font helper ──────────────────────────────────────────────────
// pdfmake cannot auto-switch fonts per character; we must split mixed text
// into inline segments and assign LATIN_FONT or BENGALI_FONT to each.

function isBengaliChar(ch: string): boolean {
  const cp = ch.codePointAt(0) ?? 0;
  return cp >= 0x0980 && cp <= 0x09FF;
}

/**
 * Returns a pdfmake text node that uses the correct font per segment.
 * Pure Latin → { text, font: Roboto }
 * Pure Bengali → { text, font: NotoSansBengali }
 * Mixed → { text: [ {text, font}, ... ] }
 * Additional props (style, bold, etc.) can be spread onto the result.
 */
function rt(raw: string | null | undefined, extraProps?: Record<string, unknown>): Record<string, unknown> {
  const text = String(raw ?? "");
  if (!text) return { text: "", font: LATIN_FONT, ...extraProps };

  // Build segments
  const segments: { text: string; isBn: boolean }[] = [];
  let cur = "";
  let curBn = isBengaliChar(text[0]);

  for (const ch of text) {
    const bn = isBengaliChar(ch);
    if (bn === curBn) {
      cur += ch;
    } else {
      if (cur) segments.push({ text: cur, isBn: curBn });
      cur = ch;
      curBn = bn;
    }
  }
  if (cur) segments.push({ text: cur, isBn: curBn });

  if (segments.length === 1) {
    return { text, font: segments[0].isBn ? BENGALI_FONT : LATIN_FONT, ...extraProps };
  }

  return {
    text: segments.map((s) => ({ text: s.text, font: s.isBn ? BENGALI_FONT : LATIN_FONT })),
    ...extraProps,
  };
}

@Injectable()
export class PdfService implements OnModuleInit {
  private readonly logger = new Logger(PdfService.name);
  private printer: any;
  private logoDataUrl: string | null = null;

  onModuleInit() {
    // ── Fonts ──────────────────────────────────────────────────────────────
    const fonts: Record<string, object> = {};

    // 1. Custom fonts from assets/fonts/
    if (fs.existsSync(path.join(FONTS_DIR, "Roboto-Regular.ttf"))) {
      fonts[LATIN_FONT] = {
        normal:      path.join(FONTS_DIR, "Roboto-Regular.ttf"),
        bold:        path.join(FONTS_DIR, "Roboto-Bold.ttf"),
        italics:     path.join(FONTS_DIR, "Roboto-Italic.ttf"),
        bolditalics: path.join(FONTS_DIR, "Roboto-BoldItalic.ttf"),
      };
    }
    if (fs.existsSync(path.join(FONTS_DIR, "NotoSansBengali-Regular.ttf"))) {
      fonts[BENGALI_FONT] = {
        normal:      path.join(FONTS_DIR, "NotoSansBengali-Regular.ttf"),
        bold:        path.join(FONTS_DIR, "NotoSansBengali-Bold.ttf"),
        italics:     path.join(FONTS_DIR, "NotoSansBengali-Regular.ttf"),
        bolditalics: path.join(FONTS_DIR, "NotoSansBengali-Bold.ttf"),
      };
    }

    // 2. Fallback: pdfmake-bundled Roboto
    if (!fonts[LATIN_FONT]) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pkg: string = require.resolve("pdfmake/package.json");
        const dir = path.join(path.dirname(pkg), "build", "fonts", "Roboto");
        const reg = path.join(dir, "Roboto-Regular.ttf");
        if (fs.existsSync(reg)) {
          fonts[LATIN_FONT] = {
            normal:      reg,
            bold:        path.join(dir, "Roboto-Medium.ttf"),
            italics:     path.join(dir, "Roboto-Italic.ttf"),
            bolditalics: path.join(dir, "Roboto-MediumItalic.ttf"),
          };
          this.logger.log("Using pdfmake bundled Roboto fonts");
        }
      } catch { /* ignore */ }
    }

    if (Object.keys(fonts).length === 0) {
      this.logger.warn("No fonts — PDF export disabled.");
    } else {
      const urlResolver = new URLResolver(fs);
      this.printer = new PdfPrinter(fonts, undefined, urlResolver);
      this.logger.log(`PDF fonts loaded: ${Object.keys(fonts).join(", ")}`);
      if (!fonts[BENGALI_FONT]) {
        this.logger.warn("NotoSansBengali missing — Bangla text in PDFs will render as boxes.");
      }
    }

    // ── Logo ───────────────────────────────────────────────────────────────
    if (fs.existsSync(LOGO_PATH)) {
      const buf = fs.readFileSync(LOGO_PATH);
      this.logoDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
      this.logger.log("Parliament logo loaded");
    }
  }

  async generate(
    reportCode: string,
    title: string,
    columns: ReportColumn[],
    rows: Record<string, unknown>[],
    lang: "en" | "bn",
  ): Promise<Buffer> {
    if (!this.printer) {
      throw new Error("PDF printer not available. Check font files in assets/fonts/.");
    }

    const today = new Date().toLocaleDateString("en-GB");

    // Column headers — Bengali labels use Bengali font, English labels use Latin font
    const headerRow = columns.map((c) => ({
      ...rt(lang === "bn" ? c.label_bn : c.label_en),
      style: "tableHeader",
    }));

    // Data cells — per-segment font switching for mixed content
    const bodyRows = rows.map((row) =>
      columns.map((c) => ({
        ...rt(String(row[c.key] ?? "")),
        style: "tableCell",
      })),
    );

    const isLandscape = columns.length > 6;

    // ── Page header ───────────────────────────────────────────────────────
    const makeHeader = (page: number, pageCount: number) => {
      const logoCell = this.logoDataUrl
        ? { image: this.logoDataUrl, width: 42, rowSpan: 2, margin: [0, 0, 10, 0] }
        : { text: "", width: 42, rowSpan: 2 };

      return {
        margin: [36, 10, 36, 0],
        table: {
          widths: [42, "*", "auto"],
          body: [
            [
              logoCell,
              {
                stack: [
                  { text: "বাংলাদেশ জাতীয় সংসদ সচিবালয়", font: BENGALI_FONT, fontSize: 8, color: "#1a4b8c" },
                  { text: "Bangladesh Parliament Secretariat", font: LATIN_FONT, bold: true, fontSize: 9, color: "#1a4b8c" },
                ],
              },
              { text: `Page ${page} / ${pageCount}`, font: LATIN_FONT, fontSize: 7, color: "#888", alignment: "right", margin: [0, 4, 0, 0] },
            ],
            [
              {},
              { ...rt(title), fontSize: 10, bold: true, color: "#1a4b8c", margin: [0, 2, 0, 0] },
              { text: reportCode, font: LATIN_FONT, fontSize: 7, color: "#888", alignment: "right" },
            ],
          ],
        },
        layout: "noBorders",
      };
    };

    // ── Page footer ───────────────────────────────────────────────────────
    const makeFooter = (_page: number) => ({
      margin: [36, 6, 36, 0],
      columns: [
        { text: `Generated: ${today}`, font: LATIN_FONT, fontSize: 7, color: "#888" },
        { text: "Bangladesh Parliament Secretariat — B&IT", font: LATIN_FONT, fontSize: 7, color: "#555", alignment: "center" },
        { text: reportCode, font: LATIN_FONT, fontSize: 7, color: "#888", alignment: "right" },
      ],
    });

    const noDataText = lang === "bn"
      ? { text: "কোনো তথ্য পাওয়া যায়নি।", font: BENGALI_FONT, italics: true, color: "#999", alignment: "center", margin: [0, 40, 0, 0] }
      : { text: "No records found.", font: LATIN_FONT, italics: true, color: "#999", alignment: "center", margin: [0, 40, 0, 0] };

    const docDef = {
      pageSize:        "A4",
      pageOrientation: isLandscape ? "landscape" : "portrait",
      pageMargins:     [36, 85, 36, 50] as [number, number, number, number],
      defaultStyle:    { font: LATIN_FONT, fontSize: 9 },

      header: makeHeader,
      footer: makeFooter,

      content: [
        { text: " ", margin: [0, 4, 0, 0] },
        rows.length === 0
          ? noDataText
          : {
              table: {
                headerRows: 1,
                widths: Array(columns.length).fill("*"),
                body: [headerRow, ...bodyRows],
              },
              layout: "lightHorizontalLines",
            },
      ],

      styles: {
        tableHeader: { bold: true, fontSize: 8.5, fillColor: "#1a4b8c", color: "#fff", margin: [3, 4, 3, 4] },
        tableCell:   { fontSize: 8, margin: [2, 3, 2, 3] },
      },
    };

    const doc = await this.printer.createPdfKitDocument(docDef);
    const chunks: Buffer[] = [];

    return new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end",  () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      doc.end();
    });
  }
}
