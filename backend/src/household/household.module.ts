import { Module } from "@nestjs/common";
import { HouseholdService } from "./household.service";
import { HouseholdController } from "./household.controller";

@Module({
  providers: [HouseholdService],
  controllers: [HouseholdController],
  exports: [HouseholdService],
})
export class HouseholdModule {}
