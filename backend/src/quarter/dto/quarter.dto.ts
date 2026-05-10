import { IsInt, IsPositive, IsString, IsNotEmpty, IsOptional, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class CreateQuarterDto {
  @IsInt() @IsPositive() category_id: number;
  @IsString() @IsNotEmpty() quarter_number: string;
  @IsString() @IsNotEmpty() location: string;
  @IsString() @IsOptional() building_name?: string;
  @IsString() @IsOptional() floor?: string;
  @IsString() @IsOptional() house_flat_number?: string;
  @IsNumber() @IsOptional() @Type(() => Number) area_sqft?: number;
}

export class UpdateQuarterDto {
  @IsInt() @IsPositive() @IsOptional() category_id?: number;
  @IsString() @IsOptional() quarter_number?: string;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() building_name?: string;
  @IsString() @IsOptional() floor?: string;
  @IsString() @IsOptional() house_flat_number?: string;
  @IsNumber() @IsOptional() @Type(() => Number) area_sqft?: number;
}
