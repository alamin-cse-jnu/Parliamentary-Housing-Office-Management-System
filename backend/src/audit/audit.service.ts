import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditEntry {
  table_name: string;
  record_id:  string;
  action:     "INSERT" | "UPDATE" | "DELETE";
  old_value?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  new_value?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  changed_by: number;
  ip_address?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /** Fire-and-forget: errors are swallowed so audit never breaks a real request */
  log(entry: AuditEntry): void {
    this.prisma.auditLog.create({ data: entry }).catch(() => { /* silent */ });
  }

  async findAll(query: {
    table_name?: string;
    changed_by?: number;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page  = Math.max(1, query.page ?? 1);
    const limit = Math.min(200, Math.max(1, query.limit ?? 50));
    const skip  = (page - 1) * limit;

    const where = {
      ...(query.table_name && { table_name: query.table_name }),
      ...(query.changed_by && { changed_by: query.changed_by }),
      ...(query.action     && { action: query.action as any }),
      ...((query.from || query.to) && {
        changed_at: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to   && { lte: new Date(query.to + "T23:59:59") }),
        },
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, full_name_en: true, role: true } },
        },
        orderBy: { changed_at: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return { total, page, limit, data };
  }

  /** Unique table names — for filter dropdown */
  async tables(): Promise<string[]> {
    const rows = await this.prisma.auditLog.findMany({
      select: { table_name: true },
      distinct: ["table_name"],
      orderBy: { table_name: "asc" },
    });
    return rows.map((r) => r.table_name);
  }
}
