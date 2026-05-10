import {
  Controller, Get, Post, Patch, Body, Param,
  Query, ParseIntPipe, UseGuards,
} from "@nestjs/common";
import { AllocationService } from "./allocation.service";
import { CreateAllocationDto, VacateAllocationDto } from "./dto/allocation.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("allocations")
@UseGuards(JwtAuthGuard)
export class AllocationController {
  constructor(private allocationService: AllocationService) {}

  // ─── LIST ─────────────────────────────────────────────────────────────────

  @Get()
  findAll(
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("occupant_type") occupant_type?: string,
  ) {
    return this.allocationService.findAll({ type, status, occupant_type });
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.allocationService.findOne(id);
  }

  // ─── ASSET-CENTRIC VIEWS ──────────────────────────────────────────────────

  @Get("asset/:type/:assetId/current")
  getCurrentForAsset(
    @Param("type") type: string,
    @Param("assetId", ParseIntPipe) assetId: number,
  ) {
    return this.allocationService.getCurrentForAsset(type as any, assetId);
  }

  @Get("asset/:type/:assetId/history")
  getHistoryForAsset(
    @Param("type") type: string,
    @Param("assetId", ParseIntPipe) assetId: number,
  ) {
    return this.allocationService.getHistoryForAsset(type as any, assetId);
  }

  // ─── OCCUPANT-CENTRIC VIEWS ───────────────────────────────────────────────

  @Get("mp/:mpId/history")
  getAllHistoryForMp(@Param("mpId", ParseIntPipe) mpId: number) {
    return this.allocationService.getAllHistoryForMp(mpId);
  }

  @Get("mp/:mpId")
  getForMp(@Param("mpId", ParseIntPipe) mpId: number) {
    return this.allocationService.getForMp(mpId);
  }

  @Get("staff/:staffId/history")
  getAllHistoryForStaff(@Param("staffId", ParseIntPipe) staffId: number) {
    return this.allocationService.getAllHistoryForStaff(staffId);
  }

  @Get("staff/:staffId")
  getForStaff(@Param("staffId", ParseIntPipe) staffId: number) {
    return this.allocationService.getForStaff(staffId);
  }

  // ─── MUTATIONS ────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  create(
    @Body() dto: CreateAllocationDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.allocationService.create(dto, user.id);
  }

  @Patch(":id/vacate")
  @UseGuards(RolesGuard) @Roles("SUPER_ADMIN", "ADMIN")
  vacate(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: VacateAllocationDto,
  ) {
    return this.allocationService.vacate(id, dto);
  }
}
