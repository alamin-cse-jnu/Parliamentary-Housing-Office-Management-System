import { Module } from "@nestjs/common";
import { TenureService } from "./tenure.service";
import { TenureController } from "./tenure.controller";

@Module({
  providers: [TenureService],
  controllers: [TenureController],
  exports: [TenureService],
})
export class TenureModule {}
