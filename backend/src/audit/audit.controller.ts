import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("audit")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN")
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  findAll(
    @Query("table_name")  tableName?: string,
    @Query("changed_by")  changedByRaw?: string,
    @Query("action")      action?: string,
    @Query("from")        from?: string,
    @Query("to")          to?: string,
    @Query("page")        pageRaw?: string,
    @Query("limit")       limitRaw?: string,
  ) {
    return this.auditService.findAll({
      table_name: tableName,
      changed_by: changedByRaw ? parseInt(changedByRaw) : undefined,
      action,
      from,
      to,
      page:  pageRaw  ? parseInt(pageRaw)  : 1,
      limit: limitRaw ? parseInt(limitRaw) : 50,
    });
  }

  @Get("tables")
  tables() {
    return this.auditService.tables();
  }
}
