import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { BackupService } from "./backup.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("backup")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN")
export class BackupController {
  constructor(private backupService: BackupService) {}

  @Post("trigger")
  trigger() {
    return this.backupService.trigger();
  }

  @Get("list")
  list() {
    return this.backupService.listBackups();
  }
}
