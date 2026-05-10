import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class BaseReportQueryDto {
  @IsEnum(["pdf", "excel", "json"])
  format: "pdf" | "excel" | "json" = "pdf";

  @IsEnum(["en", "bn"])
  lang: "en" | "bn" = "en";

  /** Comma-separated column keys — omit to include all */
  @IsString() @IsOptional()
  columns?: string;
}

export class QuarterDetailQueryDto extends BaseReportQueryDto {
  @IsInt() @IsOptional() @Type(() => Number)
  category_id?: number;

  @IsInt() @IsOptional() @Type(() => Number)
  quarter_id?: number;
}

export class QuarterOccupancyQueryDto extends BaseReportQueryDto {
  @IsInt() @IsOptional() @Type(() => Number)
  category_id?: number;

  @IsString() @IsOptional()
  status?: string;
}

export class StaffHousingQueryDto extends BaseReportQueryDto {
  @IsInt() @IsOptional() @Type(() => Number)
  category_id?: number;

  @IsInt() @IsOptional() @Type(() => Number)
  department_id?: number;

  @IsString() @IsOptional()
  status?: string;
}

export class HouseholdMemberQueryDto extends BaseReportQueryDto {
  @IsInt() @IsOptional() @Type(() => Number)
  allocation_id?: number;

  @IsInt() @IsOptional() @Type(() => Number)
  staff_id?: number;
}

export class QuarterHistoryQueryDto extends BaseReportQueryDto {
  @IsInt() @IsOptional() @Type(() => Number)
  quarter_id?: number;
}

export class MpDirectoryQueryDto extends BaseReportQueryDto {
  @IsInt() @IsOptional() @Type(() => Number)
  tenure_id?: number;

  @IsString() @IsOptional()
  status?: string;

  @IsInt() @IsOptional() @Type(() => Number)
  party_id?: number;
}

export class MpFlatQueryDto extends BaseReportQueryDto {
  @IsInt() @IsOptional() @Type(() => Number)
  category_id?: number;

  @IsString() @IsOptional()
  building_name?: string;

  @IsString() @IsOptional()
  status?: string;
}

export class VacantAssetsQueryDto extends BaseReportQueryDto {
  @IsString() @IsOptional()
  asset_type?: string;

  @IsInt() @IsOptional() @Type(() => Number)
  category_id?: number;
}

export class CategorySummaryQueryDto extends BaseReportQueryDto {
  @IsString() @IsOptional()
  asset_type?: string;
}

export class TenureChangeoverQueryDto extends BaseReportQueryDto {
  @IsInt() @IsOptional() @Type(() => Number)
  tenure_id?: number;
}
