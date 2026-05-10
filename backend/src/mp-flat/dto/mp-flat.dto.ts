import { IsInt, IsPositive, IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class CreateMpFlatDto {
  @IsInt() @IsPositive() category_id: number;
  @IsString() @IsNotEmpty() location_name: string;
  @IsString() @IsNotEmpty() building_name: string;
  @IsString() @IsNotEmpty() flat_number: string;
  @IsString() @IsOptional() floor?: string;
  @IsNumber() @IsOptional() @Type(() => Number) area_sqft?: number;
}

export class UpdateMpFlatDto {
  @IsInt() @IsPositive() @IsOptional() category_id?: number;
  @IsString() @IsOptional() location_name?: string;
  @IsString() @IsOptional() building_name?: string;
  @IsString() @IsOptional() flat_number?: string;
  @IsString() @IsOptional() floor?: string;
  @IsNumber() @IsOptional() @Type(() => Number) area_sqft?: number;
}
