import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.systemUser.findUnique({
      where: { username: dto.username },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    const token = this.jwt.sign({ sub: user.id, username: user.username, role: user.role });

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        full_name_en: user.full_name_en,
        full_name_bn: user.full_name_bn,
        role: user.role,
      },
    };
  }

  async me(userId: number) {
    return this.prisma.systemUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        full_name_en: true,
        full_name_bn: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    });
  }
}
