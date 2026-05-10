import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { LookupsModule } from "./lookups/lookups.module";
import { StorageModule } from "./storage/storage.module";
import { TenureModule } from "./tenure/tenure.module";
import { MpModule } from "./mp/mp.module";
import { StaffModule } from "./staff/staff.module";
import { OfficeModule } from "./office/office.module";
import { MpFlatModule } from "./mp-flat/mp-flat.module";
import { QuarterModule } from "./quarter/quarter.module";
import { AllocationModule } from "./allocation/allocation.module";
import { HouseholdModule } from "./household/household.module";
import { ReportsModule } from "./reports/reports.module";
import { AuditModule } from "./audit/audit.module";
import { AuditInterceptor } from "./audit/audit.interceptor";
import { UploadModule } from "./upload/upload.module";
import { BackupModule } from "./backup/backup.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StorageModule,
    AuditModule,
    AuthModule,
    UsersModule,
    LookupsModule,
    TenureModule,
    MpModule,
    StaffModule,
    OfficeModule,
    MpFlatModule,
    QuarterModule,
    AllocationModule,
    HouseholdModule,
    ReportsModule,
    UploadModule,
    BackupModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
