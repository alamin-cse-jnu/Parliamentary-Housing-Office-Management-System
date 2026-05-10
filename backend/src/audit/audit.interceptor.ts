import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { Prisma } from "@prisma/client";
import { AuditService } from "./audit.service";

const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/** Maps URL segment → DB table name */
const PATH_TABLE: Record<string, string> = {
  "allocations":          "allocations",
  "mps":                  "mps",
  "staff":                "staff",
  "offices":              "mp_offices",
  "mp-flats":             "mp_flats",
  "quarters":             "staff_quarters",
  "household-members":    "household_members",
  "tenure":               "parliament_tenures",
  "users":                "system_users",
  "lookups":              "lookups",
};

/** Maps HTTP method to audit action */
function resolveAction(method: string): "INSERT" | "UPDATE" | "DELETE" {
  if (method === "POST")                   return "INSERT";
  if (method === "DELETE")                 return "DELETE";
  return "UPDATE";
}

/** Extracts table name + record_id from /api/resource/123/sub-action */
function parsePath(url: string): { table: string; recordId: string } {
  // strip query string and /api prefix
  const path = url.split("?")[0].replace(/^\/api\//, "");
  const parts = path.split("/").filter(Boolean);

  const segment = parts[0] ?? "unknown";
  // For /lookups/:type/:id, use the type as part of table name
  const table = segment === "lookups" && parts[1]
    ? `lookup_${parts[1].replace(/-/g, "_")}`
    : (PATH_TABLE[segment] ?? segment);

  // record_id is the first numeric segment after the resource
  const recordId = parts.slice(1).find((p) => /^\d+$/.test(p)) ?? "0";

  return { table, recordId };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<any>();

    if (!MUTATING.has(req.method)) return next.handle();

    // Skip file upload endpoints (multipart) — body is a file, not JSON
    if ((req.headers["content-type"] ?? "").includes("multipart/form-data")) {
      return next.handle();
    }

    const user: { id: number } | undefined = req.user;
    if (!user) return next.handle(); // unauthenticated — skip (auth guard handles rejection)

    const ip = req.ip ?? req.connection?.remoteAddress ?? "";
    const { table, recordId } = parsePath(req.url);
    const action = resolveAction(req.method);
    const requestBody = req.body ?? null;

    return next.handle().pipe(
      tap((responseBody) => {
        const newVal: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
          action === "DELETE" ? Prisma.JsonNull : (responseBody ?? Prisma.JsonNull);
        const oldVal: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
          action === "INSERT" ? Prisma.JsonNull : (requestBody ?? Prisma.JsonNull);

        this.auditService.log({
          table_name: table,
          record_id:  recordId,
          action,
          old_value:  oldVal,
          new_value:  newVal,
          changed_by: user.id,
          ip_address: ip,
        });
      }),
    );
  }
}
