import {
  Controller, Get, Patch, Post, Delete, Body, Param, Query,
  ParseIntPipe, UseGuards, UseInterceptors, UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { MpService } from "./mp.service";
import { CreateMpDto, UpdateMpDto, MpUploadConfirmDto, AssignDesignationDto } from "./dto/mp.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

const excelUpload = FileInterceptor("file", {
  storage: memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ok = /\.(xlsx|xls)$/i.test(file.originalname);
    cb(ok ? null : new Error("Only .xlsx/.xls files allowed"), ok);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const photoUpload = FileInterceptor("photo", {
  storage: memoryStorage(),
  limits: { fileSize: 500 * 1024 },
});

@Controller("mp")
@UseGuards(JwtAuthGuard)
export class MpController {
  constructor(private mpService: MpService) {}

  // ─── LIST / DETAIL ─────────────────────────────────────────────────────────

  @Get()
  findAll(
    @Query("tenure_id") tenure_id?: string,
    @Query("status") status?: string,
    @Query("party_id") party_id?: string,
    @Query("search") search?: string,
  ) {
    return this.mpService.findAll({
      tenure_id: tenure_id ? parseInt(tenure_id) : undefined,
      status,
      party_id: party_id ? parseInt(party_id) : undefined,
      search,
    });
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.mpService.findOne(id);
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body() dto: CreateMpDto) {
    return this.mpService.create(dto);
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateMpDto) {
    return this.mpService.update(id, dto);
  }

  // ─── PHOTO ─────────────────────────────────────────────────────────────────

  @Post(":id/photo")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @UseInterceptors(photoUpload)
  uploadPhoto(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mpService.uploadPhoto(id, file);
  }

  // ─── DESIGNATION ───────────────────────────────────────────────────────────

  @Get(":id/designation-history")
  getDesignationHistory(@Param("id", ParseIntPipe) id: number) {
    return this.mpService.getDesignationHistory(id);
  }

  @Post(":id/designation")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  assignDesignation(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AssignDesignationDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.mpService.assignDesignation(id, dto, user.id);
  }

  // ─── EXCEL UPLOAD ──────────────────────────────────────────────────────────

  @Post("upload/preview")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @UseInterceptors(excelUpload)
  previewUpload(@UploadedFile() file: Express.Multer.File) {
    return this.mpService.previewUpload(file);
  }

  @Post("upload/confirm")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  confirmUpload(
    @Body() dto: MpUploadConfirmDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.mpService.confirmUpload(dto, user.id);
  }
}
