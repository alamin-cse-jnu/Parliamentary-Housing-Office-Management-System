import {
  IsInt, IsPositive, IsString, IsOptional, IsDateString, IsBoolean,
} from "class-validator";

export class CreateHouseholdMemberDto {
  @IsInt() @IsPositive()
  staff_id: number;

  @IsInt() @IsPositive()
  allocation_id: number;

  @IsString()
  name_bn: string;

  @IsString()
  name_en: string;

  @IsInt() @IsPositive()
  relation_type_id: number;

  @IsDateString() @IsOptional()
  date_of_birth?: string;

  @IsString() @IsOptional()
  identity_number?: string;
}

export class UpdateHouseholdMemberDto {
  @IsString() @IsOptional()
  name_bn?: string;

  @IsString() @IsOptional()
  name_en?: string;

  @IsInt() @IsPositive() @IsOptional()
  relation_type_id?: number;

  @IsDateString() @IsOptional()
  date_of_birth?: string;

  @IsString() @IsOptional()
  identity_number?: string;
}
