import { IsEnum, IsInt, IsPositive, IsDateString, IsOptional, IsString } from "class-validator";

export class CreateAllocationDto {
  @IsEnum(["OFFICE", "MP_FLAT", "STAFF_QUARTER"])
  allocation_type: string;

  // asset_id: id of MpOffice | MpFlat | StaffQuarter depending on allocation_type
  @IsInt() @IsPositive()
  asset_id: number;

  @IsEnum(["MP", "STAFF"])
  occupant_type: string;

  // occupant_id: id of Mp | Staff depending on occupant_type
  @IsInt() @IsPositive()
  occupant_id: number;

  @IsDateString()
  allotment_date: string;

  @IsString() @IsOptional()
  remarks?: string;
}

export class VacateAllocationDto {
  @IsDateString()
  vacated_date: string;

  @IsString() @IsOptional()
  remarks?: string;
}
