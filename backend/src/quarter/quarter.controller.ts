import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from "@nestjs/common";
import { QuarterService } from "./quarter.service";
import { CreateQuarterDto, UpdateQuarterDto } from "./dto/quarter.dto";
import { UpdateAssetStatusDto } from "../office/dto/office.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("quarters")
@UseGuards(JwtAuthGuard)
export class QuarterController {
  constructor(private quarterService: QuarterService) {}

  @Get()
  findAll(
    @Query("category_id") category_id?: string,
    @Query("location") location?: string,
    @Query("status") status?: string,
  ) {
    return this.quarterService.findAll({
      category_id: category_id ? +category_id : undefined,
      location,
      status,
    });
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.quarterService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body() dto: CreateQuarterDto) {
    return this.quarterService.create(dto);
  }

  @Patch(":id")
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateQuarterDto) {
    return this.quarterService.update(id, dto);
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAssetStatusDto) {
    return this.quarterService.updateStatus(id, dto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.quarterService.remove(id);
  }
}
