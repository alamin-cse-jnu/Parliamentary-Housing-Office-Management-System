import { IsInt, IsPositive, IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";

export class CreateOfficeDto {
  @IsInt() @IsPositive() building_id: number;
  @IsString() @IsOptional() floor?: string;
  @IsString() @IsNotEmpty() room_number: string;
  @IsString() @IsOptional() phone_intercom?: string;
}

export class UpdateOfficeDto {
  @IsInt() @IsPositive() @IsOptional() building_id?: number;
  @IsString() @IsOptional() floor?: string;
  @IsString() @IsNotEmpty() @IsOptional() room_number?: string;
  @IsString() @IsOptional() phone_intercom?: string;
}

export class UpdateAssetStatusDto {
  @IsEnum(["VACANT", "OCCUPIED", "UNDER_MAINTENANCE"])
  status: string;
}
