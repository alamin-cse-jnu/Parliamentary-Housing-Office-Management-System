import { Module } from "@nestjs/common";
import { QuarterService } from "./quarter.service";
import { QuarterController } from "./quarter.controller";

@Module({ providers: [QuarterService], controllers: [QuarterController], exports: [QuarterService] })
export class QuarterModule {}
