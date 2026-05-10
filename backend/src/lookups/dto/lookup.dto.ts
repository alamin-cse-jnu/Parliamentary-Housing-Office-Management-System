import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateLookupDto {
  @IsString()
  @IsNotEmpty()
  name_bn: string;

  @IsString()
  @IsNotEmpty()
  name_en: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sort_order?: number;
}

export class UpdateLookupDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name_bn?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name_en?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sort_order?: number;
}
