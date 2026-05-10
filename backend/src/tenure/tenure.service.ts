import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTenureDto, UpdateTenureDto, CloseTenureDto } from "./dto/tenure.dto";

@Injectable()
export class TenureService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.parliamentTenure.findMany({
      orderBy: { start_date: "desc" },
      include: { _count: { select: { mps: true } } },
    });
  }

  async findOne(id: number) {
    const tenure = await this.prisma.parliamentTenure.findUnique({
      where: { id },
      include: { _count: { select: { mps: true } } },
    });
    if (!tenure) throw new NotFoundException(`Tenure #${id} not found`);
    return tenure;
  }

  create(dto: CreateTenureDto, userId: number) {
    return this.prisma.parliamentTenure.create({
      data: {
        name: dto.name,
        start_date: new Date(dto.start_date),
        created_by: userId,
      },
    });
  }

  async update(id: number, dto: UpdateTenureDto) {
    await this.findOne(id);
    return this.prisma.parliamentTenure.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.end_date && { end_date: new Date(dto.end_date) }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
    });
  }

  async close(id: number, dto: CloseTenureDto) {
    await this.findOne(id);
    return this.prisma.parliamentTenure.update({
      where: { id },
      data: { end_date: new Date(dto.end_date), is_active: false },
    });
  }

  findActive() {
    return this.prisma.parliamentTenure.findFirst({
      where: { is_active: true },
      orderBy: { start_date: "desc" },
    });
  }
}
