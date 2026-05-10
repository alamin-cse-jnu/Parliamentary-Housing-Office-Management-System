import { Global, Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { AuditController } from "./audit.controller";
import { AuditInterceptor } from "./audit.interceptor";

@Global()
@Module({
  providers: [AuditService, AuditInterceptor],
  controllers: [AuditController],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
