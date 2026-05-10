import {
  Controller, Get, Query, Res, UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { ReportsService, R01_COLS, R02_COLS, R03_COLS, R04_COLS, R05_COLS, R06_COLS, R07_COLS, R08_COLS, R10_COLS, R11_COLS } from "./reports.service";
import { PdfService } from "./pdf.service";
import { ExcelService } from "./excel.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  QuarterDetailQueryDto, QuarterOccupancyQueryDto, StaffHousingQueryDto,
  HouseholdMemberQueryDto, QuarterHistoryQueryDto, MpDirectoryQueryDto,
  MpFlatQueryDto, VacantAssetsQueryDto, CategorySummaryQueryDto, TenureChangeoverQueryDto,
} from "./dto/report-query.dto";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private reports: ReportsService,
    private pdf: PdfService,
    private excel: ExcelService,
  ) {}

  // ─── R-01: Quarter Detail ─────────────────────────────────────────────────

  @Get("r01")
  async r01(@Query() q: QuarterDetailQueryDto, @Res() res: Response) {
    const cols = this.reports.filterColumns(R01_COLS, q.columns);
    const rows = await this.reports.r01(q.lang, { category_id: q.category_id, quarter_id: q.quarter_id });
    return this.#send(res, q.format, q.lang, "R-01", "Quarter Detail Report", cols, rows);
  }

  // ─── R-02: All Quarters Occupancy ─────────────────────────────────────────

  @Get("r02")
  async r02(@Query() q: QuarterOccupancyQueryDto, @Res() res: Response) {
    const cols = this.reports.filterColumns(R02_COLS, q.columns);
    const rows = await this.reports.r02(q.lang, { category_id: q.category_id, status: q.status });
    return this.#send(res, q.format, q.lang, "R-02", "All Quarters Occupancy Status", cols, rows);
  }

  // ─── R-03: Staff Housing Directory ────────────────────────────────────────

  @Get("r03")
  async r03(@Query() q: StaffHousingQueryDto, @Res() res: Response) {
    const cols = this.reports.filterColumns(R03_COLS, q.columns);
    const rows = await this.reports.r03(q.lang, { category_id: q.category_id, department_id: q.department_id, status: q.status });
    return this.#send(res, q.format, q.lang, "R-03", "Staff Housing Directory", cols, rows);
  }

  // ─── R-04: Household Member List ─────────────────────────────────────────

  @Get("r04")
  async r04(@Query() q: HouseholdMemberQueryDto, @Res() res: Response) {
    const cols = this.reports.filterColumns(R04_COLS, q.columns);
    const rows = await this.reports.r04(q.lang, { allocation_id: q.allocation_id, staff_id: q.staff_id });
    return this.#send(res, q.format, q.lang, "R-04", "Household Member List", cols, rows);
  }

  // ─── R-05: Quarter Occupancy History ─────────────────────────────────────

  @Get("r05")
  async r05(@Query() q: QuarterHistoryQueryDto, @Res() res: Response) {
    const cols = this.reports.filterColumns(R05_COLS, q.columns);
    const rows = await this.reports.r05(q.lang, { quarter_id: q.quarter_id });
    return this.#send(res, q.format, q.lang, "R-05", "Quarter Occupancy History", cols, rows);
  }

  // ─── R-06: MP Office & Flat Directory ────────────────────────────────────

  @Get("r06")
  async r06(@Query() q: MpDirectoryQueryDto, @Res() res: Response) {
    const cols = this.reports.filterColumns(R06_COLS, q.columns);
    const rows = await this.reports.r06(q.lang, { tenure_id: q.tenure_id, status: q.status, party_id: q.party_id });
    return this.#send(res, q.format, q.lang, "R-06", "MP Office & Flat Directory", cols, rows);
  }

  // ─── R-07: MP Flat Occupancy ─────────────────────────────────────────────

  @Get("r07")
  async r07(@Query() q: MpFlatQueryDto, @Res() res: Response) {
    const cols = this.reports.filterColumns(R07_COLS, q.columns);
    const rows = await this.reports.r07(q.lang, { category_id: q.category_id, building_name: q.building_name, status: q.status });
    return this.#send(res, q.format, q.lang, "R-07", "MP Flat Occupancy", cols, rows);
  }

  // ─── R-08: Vacant Assets Summary ─────────────────────────────────────────

  @Get("r08")
  async r08(@Query() q: VacantAssetsQueryDto, @Res() res: Response) {
    const cols = this.reports.filterColumns(R08_COLS, q.columns);
    const rows = await this.reports.r08(q.lang, { asset_type: q.asset_type, category_id: q.category_id });
    return this.#send(res, q.format, q.lang, "R-08", "Vacant Assets Summary", cols, rows);
  }

  // ─── R-10: Category-wise Summary ─────────────────────────────────────────

  @Get("r10")
  async r10(@Query() q: CategorySummaryQueryDto, @Res() res: Response) {
    const cols = this.reports.filterColumns(R10_COLS, q.columns);
    const rows = await this.reports.r10(q.lang, { asset_type: q.asset_type });
    return this.#send(res, q.format, q.lang, "R-10", "Category-wise Summary", cols, rows);
  }

  // ─── R-11: Tenure Changeover ──────────────────────────────────────────────

  @Get("r11")
  async r11(@Query() q: TenureChangeoverQueryDto, @Res() res: Response) {
    const cols = this.reports.filterColumns(R11_COLS, q.columns);
    const rows = await this.reports.r11(q.lang, { tenure_id: q.tenure_id });
    return this.#send(res, q.format, q.lang, "R-11", "Tenure Changeover Report", cols, rows);
  }

  // ─── Private: stream response ─────────────────────────────────────────────

  async #send(
    res: Response,
    format: "pdf" | "excel" | "json",
    lang: "en" | "bn",
    code: string,
    title: string,
    cols: ReturnType<ReportsService["filterColumns"]>,
    rows: Record<string, unknown>[],
  ) {
    const slug = code.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const date = new Date().toISOString().slice(0, 10);

    if (format === "json") {
      return res.json({ code, title, columns: cols, rows, generated_at: new Date().toISOString() });
    }

    if (format === "excel") {
      const buf = this.excel.generate(title, cols, rows, lang);
      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${slug}-${date}.xlsx"`,
      });
      return res.send(buf);
    }

    const buf = await this.pdf.generate(code, title, cols, rows, lang);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}-${date}.pdf"`,
    });
    return res.send(buf);
  }
}
