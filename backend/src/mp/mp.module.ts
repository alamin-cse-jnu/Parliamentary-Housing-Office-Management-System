import { Module } from "@nestjs/common";
import { MpService } from "./mp.service";
import { MpController } from "./mp.controller";

@Module({
  providers: [MpService],
  controllers: [MpController],
  exports: [MpService],
})
export class MpModule {}
