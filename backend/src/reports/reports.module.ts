import { Module } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";
import { PdfService } from "./pdf.service";
import { ExcelService } from "./excel.service";

@Module({
  providers: [ReportsService, PdfService, ExcelService],
  controllers: [ReportsController],
})
export class ReportsModule {}
