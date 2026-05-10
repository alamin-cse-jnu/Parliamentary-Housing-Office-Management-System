import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, UseGuards,
} from "@nestjs/common";
import { LookupsService } from "./lookups.service";
import type { LookupType } from "./lookups.service";
import { CreateLookupDto, UpdateLookupDto } from "./dto/lookup.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

// Single controller covers all 7 lookup types via the :type param:
//   GET/POST  /api/lookups/mp-flat-categories
//   GET/POST  /api/lookups/quarter-categories
//   GET/POST  /api/lookups/political-parties
//   GET/POST  /api/lookups/departments
//   GET/POST  /api/lookups/mp-designations
//   GET/POST  /api/lookups/office-buildings
//   GET/POST  /api/lookups/relation-types

@Controller("lookups/:type")
@UseGuards(JwtAuthGuard)
export class LookupsController {
  constructor(private lookupsService: LookupsService) {}

  @Get()
  findAll(@Param("type") type: LookupType) {
    return this.lookupsService.findAll(type);
  }

  @Get(":id")
  findOne(@Param("type") type: LookupType, @Param("id", ParseIntPipe) id: number) {
    return this.lookupsService.findOne(type, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Param("type") type: LookupType, @Body() dto: CreateLookupDto) {
    return this.lookupsService.create(type, dto);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  update(
    @Param("type") type: LookupType,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateLookupDto,
  ) {
    return this.lookupsService.update(type, id, dto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  remove(@Param("type") type: LookupType, @Param("id", ParseIntPipe) id: number) {
    return this.lookupsService.remove(type, id);
  }
}
