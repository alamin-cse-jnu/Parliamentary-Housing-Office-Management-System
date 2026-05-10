import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from "@nestjs/common";
import { MpFlatService } from "./mp-flat.service";
import { CreateMpFlatDto, UpdateMpFlatDto } from "./dto/mp-flat.dto";
import { UpdateAssetStatusDto } from "../office/dto/office.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("mp-flats")
@UseGuards(JwtAuthGuard)
export class MpFlatController {
  constructor(private mpFlatService: MpFlatService) {}

  @Get()
  findAll(
    @Query("category_id") category_id?: string,
    @Query("building_name") building_name?: string,
    @Query("status") status?: string,
  ) {
    return this.mpFlatService.findAll({
      category_id: category_id ? +category_id : undefined,
      building_name,
      status,
    });
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.mpFlatService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body() dto: CreateMpFlatDto) {
    return this.mpFlatService.create(dto);
  }

  @Patch(":id")
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateMpFlatDto) {
    return this.mpFlatService.update(id, dto);
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAssetStatusDto) {
    return this.mpFlatService.updateStatus(id, dto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.mpFlatService.remove(id);
  }
}
