import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import { TenureService } from "./tenure.service";
import { CreateTenureDto, UpdateTenureDto, CloseTenureDto } from "./dto/tenure.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("tenures")
@UseGuards(JwtAuthGuard)
export class TenureController {
  constructor(private tenureService: TenureService) {}

  @Get()
  findAll() {
    return this.tenureService.findAll();
  }

  @Get("active")
  findActive() {
    return this.tenureService.findActive();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.tenureService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body() dto: CreateTenureDto, @CurrentUser() user: { id: number }) {
    return this.tenureService.create(dto, user.id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateTenureDto) {
    return this.tenureService.update(id, dto);
  }

  @Patch(":id/close")
  @UseGuards(RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  close(@Param("id", ParseIntPipe) id: number, @Body() dto: CloseTenureDto) {
    return this.tenureService.close(id, dto);
  }
}
