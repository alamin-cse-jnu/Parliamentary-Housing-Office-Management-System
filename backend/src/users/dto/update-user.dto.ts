import { IsString, IsOptional, IsEnum, IsBoolean, MinLength, Matches } from "class-validator";

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  full_name_en?: string;

  @IsString()
  @IsOptional()
  full_name_bn?: string;

  @IsEnum(["SUPER_ADMIN", "ADMIN"])
  @IsOptional()
  role?: "SUPER_ADMIN" | "ADMIN";

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Password must contain uppercase, lowercase, and a number",
  })
  new_password: string;
}
