import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from "@nestjs/common";
import { UploadService } from "./upload.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("upload-logs")
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Get()
  findAll(
    @Query("upload_type") uploadType?: string,
    @Query("page")        pageRaw?: string,
    @Query("limit")       limitRaw?: string,
  ) {
    return this.uploadService.findAll({
      upload_type: uploadType,
      page:  pageRaw  ? parseInt(pageRaw)  : 1,
      limit: limitRaw ? parseInt(limitRaw) : 20,
    });
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.uploadService.findOne(id);
  }
}
