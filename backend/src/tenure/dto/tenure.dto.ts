import { IsString, IsNotEmpty, IsDateString, IsOptional, IsBoolean } from "class-validator";

export class CreateTenureDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  start_date: string;
}

export class UpdateTenureDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class CloseTenureDto {
  @IsDateString()
  end_date: string;
}
