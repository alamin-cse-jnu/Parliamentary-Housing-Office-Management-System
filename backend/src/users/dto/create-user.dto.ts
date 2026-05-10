import { IsString, IsNotEmpty, IsEnum, IsOptional, MinLength, Matches } from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Password must contain uppercase, lowercase, and a number",
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  full_name_en: string;

  @IsString()
  @IsOptional()
  full_name_bn?: string;

  @IsEnum(["SUPER_ADMIN", "ADMIN"])
  @IsOptional()
  role?: "SUPER_ADMIN" | "ADMIN";
}
