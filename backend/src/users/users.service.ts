import { Injectable, ConflictException, NotFoundException, BadRequestException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto, ChangePasswordDto } from "./dto/update-user.dto";

const SAFE_SELECT = {
  id: true,
  username: true,
  full_name_en: true,
  full_name_bn: true,
  role: true,
  is_active: true,
  created_at: true,
  updated_at: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.systemUser.findMany({ select: SAFE_SELECT, orderBy: { created_at: "asc" } });
  }

  async findOne(id: number) {
    const user = await this.prisma.systemUser.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.systemUser.findUnique({ where: { username: dto.username } });
    if (exists) throw new ConflictException("Username already taken");

    const password = await bcrypt.hash(dto.password, 10);
    return this.prisma.systemUser.create({
      data: { ...dto, password, role: dto.role ?? "ADMIN" },
      select: SAFE_SELECT,
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.systemUser.update({ where: { id }, data: dto, select: SAFE_SELECT });
  }

  async changePassword(id: number, dto: ChangePasswordDto) {
    await this.findOne(id);
    const password = await bcrypt.hash(dto.new_password, 10);
    await this.prisma.systemUser.update({ where: { id }, data: { password } });
    return { message: "Password updated" };
  }

  async deactivate(id: number, requesterId: number) {
    if (id === requesterId) throw new BadRequestException("Cannot deactivate your own account");
    await this.findOne(id);
    return this.prisma.systemUser.update({
      where: { id },
      data: { is_active: false },
      select: SAFE_SELECT,
    });
  }
}
