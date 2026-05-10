import {
  IsString, IsNotEmpty, IsOptional, IsEnum,
  IsInt, IsPositive, IsArray, ValidateNested, Min, Max,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateStaffDto {
  @IsString() @IsNotEmpty() internal_user_id: string;
  @IsString() @IsNotEmpty() name_en: string;
  @IsString() @IsOptional() name_bn?: string;
  @IsString() @IsOptional() mobile?: string;
  @IsEnum(["CLASS_1","CLASS_2","CLASS_3","CLASS_4","NO_CLASS"]) employee_class: string;
  @IsInt() @Min(1) @Max(20) grade: number;
  @IsString() @IsNotEmpty() designation: string;
  @IsInt() @IsPositive() department_id: number;
  @IsEnum(["MALE","FEMALE","OTHER"]) @IsOptional() gender?: string;
  @IsEnum(["SINGLE","MARRIED","DIVORCED","WIDOWED"]) @IsOptional() marital_status?: string;
}

export class UpdateStaffDto {
  @IsString()    @IsOptional() name_bn?: string;
  @IsString()    @IsOptional() name_en?: string;
  @IsString()    @IsOptional() mobile?: string;
  @IsEnum(["CLASS_1","CLASS_2","CLASS_3","CLASS_4","NO_CLASS"]) @IsOptional() employee_class?: string;
  @IsInt() @Min(1) @Max(20) @IsOptional() grade?: number;
  @IsString()    @IsOptional() designation?: string;
  @IsInt()       @IsOptional() department_id?: number;
  @IsEnum(["MALE","FEMALE","OTHER"]) @IsOptional() gender?: string;
  @IsEnum(["SINGLE","MARRIED","DIVORCED","WIDOWED"]) @IsOptional() marital_status?: string;
  @IsEnum(["ACTIVE","RETIRED","TRANSFERRED","DECEASED"]) @IsOptional() service_status?: string;
}

export class StaffUploadConfirmDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffRowDto)
  rows: StaffRowDto[];
}

export class StaffRowDto {
  @IsString() @IsNotEmpty() internal_user_id: string;
  @IsString() @IsOptional() name_en?: string;
  @IsString() @IsOptional() name_bn?: string;
  @IsString() @IsOptional() mobile?: string;
  @IsString() @IsOptional() employee_class?: string;
  @IsInt()    @IsOptional() grade?: number;
  @IsString() @IsOptional() department_en?: string;
  @IsString() @IsOptional() department_bn?: string;
  @IsString() @IsNotEmpty() designation: string;
  @IsString() @IsOptional() gender?: string;
  @IsString() @IsOptional() marital_status?: string;
}

export class ChangeDesignationDto {
  @IsString() @IsNotEmpty() new_designation: string;
  @IsString() @IsNotEmpty() effective_date: string;
}
