import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  ParseIntPipe, UseGuards, UseInterceptors, UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { HouseholdService } from "./household.service";
import { CreateHouseholdMemberDto, UpdateHouseholdMemberDto } from "./dto/household.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("household-members")
@UseGuards(JwtAuthGuard)
export class HouseholdController {
  constructor(private householdService: HouseholdService) {}

  // ─── QUERIES ──────────────────────────────────────────────────────────────

  @Get("staff/:staffId")
  listForStaff(@Param("staffId", ParseIntPipe) staffId: number) {
    return this.householdService.listForStaff(staffId);
  }

  @Get("allocation/:allocationId")
  listForAllocation(@Param("allocationId", ParseIntPipe) allocationId: number) {
    return this.householdService.listForAllocation(allocationId);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.householdService.findOne(id);
  }

  // ─── MUTATIONS ────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body() dto: CreateHouseholdMemberDto) {
    return this.householdService.create(dto);
  }

  @Patch(":id")
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateHouseholdMemberDto,
  ) {
    return this.householdService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.householdService.remove(id);
  }

  @Post(":id/photo")
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  @UseInterceptors(FileInterceptor("photo", { storage: memoryStorage() }))
  uploadPhoto(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.householdService.uploadPhoto(id, file);
  }
}
