import {
  IsString, IsNotEmpty, IsOptional, IsEnum, IsInt,
  IsPositive, IsDateString, IsArray, ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateMpDto {
  @IsString() @IsNotEmpty() parliament_number: string;
  @IsString() @IsNotEmpty() internal_user_id: string;
  @IsString() @IsNotEmpty() name_en: string;
  @IsString() @IsOptional() name_bn?: string;
  @IsString() @IsNotEmpty() constituency: string;
  @IsInt() @IsPositive() party_id: number;
  @IsInt() @IsPositive() tenure_id: number;
  @IsEnum(["MALE", "FEMALE", "OTHER"]) @IsOptional() gender?: string;
  @IsEnum(["ACTIVE", "RESIGNED", "DECEASED", "SEAT_VACANT"]) @IsOptional() status?: string;
}

export class UpdateMpDto {
  @IsString() @IsOptional() name_bn?: string;
  @IsString() @IsOptional() name_en?: string;
  @IsString() @IsOptional() constituency?: string;
  @IsInt()    @IsOptional() party_id?: number;
  @IsEnum(["MALE", "FEMALE", "OTHER"]) @IsOptional() gender?: string;
  @IsEnum(["ACTIVE", "RESIGNED", "DECEASED", "SEAT_VACANT"]) @IsOptional() status?: string;
  @IsInt()    @IsOptional() designation_id?: number;
  @IsDateString() @IsOptional() designation_since?: string;
}

export class MpUploadConfirmDto {
  @IsInt()
  @IsPositive()
  tenure_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MpRowDto)
  rows: MpRowDto[];
}

export class MpRowDto {
  @IsString() @IsNotEmpty() parliament_number: string;
  @IsString() @IsNotEmpty() internal_user_id: string;
  @IsString() @IsOptional() name_en?: string;
  @IsString() @IsOptional() name_bn?: string;
  @IsString() @IsNotEmpty() constituency: string;
  @IsString() @IsNotEmpty() party: string;
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() gender?: string;
}

export class AssignDesignationDto {
  @IsInt() @IsPositive() designation_id: number;
  @IsDateString() effective_date: string;
}
