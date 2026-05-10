import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from "@nestjs/common";
import { OfficeService } from "./office.service";
import { CreateOfficeDto, UpdateOfficeDto, UpdateAssetStatusDto } from "./dto/office.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("offices")
@UseGuards(JwtAuthGuard)
export class OfficeController {
  constructor(private officeService: OfficeService) {}

  @Get()
  findAll(@Query("status") status?: string, @Query("building_id") building_id?: string) {
    return this.officeService.findAll({ status, building_id: building_id ? +building_id : undefined });
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.officeService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body() dto: CreateOfficeDto) {
    return this.officeService.create(dto);
  }

  @Patch(":id")
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateOfficeDto) {
    return this.officeService.update(id, dto);
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAssetStatusDto) {
    return this.officeService.updateStatus(id, dto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.officeService.remove(id);
  }
}
