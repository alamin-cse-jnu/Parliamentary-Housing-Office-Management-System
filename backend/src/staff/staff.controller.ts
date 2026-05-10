import {
  Controller, Get, Patch, Post, Body, Param, Query,
  ParseIntPipe, UseGuards, UseInterceptors, UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { StaffService } from "./staff.service";
import { CreateStaffDto, UpdateStaffDto, StaffUploadConfirmDto, ChangeDesignationDto } from "./dto/staff.dto";
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

@Controller("staff")
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private staffService: StaffService) {}

  // ─── LIST / DETAIL ─────────────────────────────────────────────────────────

  @Get()
  findAll(
    @Query("status") status?: string,
    @Query("department_id") department_id?: string,
    @Query("grade") grade?: string,
    @Query("employee_class") employee_class?: string,
    @Query("search") search?: string,
  ) {
    return this.staffService.findAll({
      status,
      department_id: department_id ? parseInt(department_id) : undefined,
      grade: grade ? parseInt(grade) : undefined,
      employee_class,
      search,
    });
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.staffService.findOne(id);
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(id, dto);
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
    return this.staffService.uploadPhoto(id, file);
  }

  // ─── DESIGNATION ───────────────────────────────────────────────────────────

  @Get(":id/designation-history")
  getDesignationHistory(@Param("id", ParseIntPipe) id: number) {
    return this.staffService.getDesignationHistory(id);
  }

  @Post(":id/designation")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  changeDesignation(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ChangeDesignationDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.staffService.changeDesignation(id, dto, user.id);
  }

  // ─── EXCEL UPLOAD ──────────────────────────────────────────────────────────

  @Post("upload/preview")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @UseInterceptors(excelUpload)
  previewUpload(@UploadedFile() file: Express.Multer.File) {
    return this.staffService.previewUpload(file);
  }

  @Post("upload/confirm")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  confirmUpload(
    @Body() dto: StaffUploadConfirmDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.staffService.confirmUpload(dto, user.id);
  }
}
