import { Module } from "@nestjs/common";
import { MpFlatService } from "./mp-flat.service";
import { MpFlatController } from "./mp-flat.controller";

@Module({ providers: [MpFlatService], controllers: [MpFlatController], exports: [MpFlatService] })
export class MpFlatModule {}
