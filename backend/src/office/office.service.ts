import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOfficeDto, UpdateOfficeDto, UpdateAssetStatusDto } from "./dto/office.dto";

const INCLUDE = { building: true };

@Injectable()
export class OfficeService {
  constructor(private prisma: PrismaService) {}

  findAll(query: { status?: string; building_id?: number }) {
    return this.prisma.mpOffice.findMany({
      where: {
        ...(query.status      && { status: query.status as any }),
        ...(query.building_id && { building_id: query.building_id }),
      },
      include: INCLUDE,
      orderBy: [{ building_id: "asc" }, { floor: "asc" }, { room_number: "asc" }],
    });
  }

  async findOne(id: number) {
    const office = await this.prisma.mpOffice.findUnique({ where: { id }, include: INCLUDE });
    if (!office) throw new NotFoundException(`Office #${id} not found`);
    return office;
  }

  create(dto: CreateOfficeDto) {
    return this.prisma.mpOffice.create({ data: dto as any, include: INCLUDE });
  }

  async update(id: number, dto: UpdateOfficeDto) {
    await this.findOne(id);
    return this.prisma.mpOffice.update({ where: { id }, data: dto as any, include: INCLUDE });
  }

  async updateStatus(id: number, dto: UpdateAssetStatusDto) {
    await this.findOne(id);
    return this.prisma.mpOffice.update({
      where: { id },
      data: { status: dto.status as any },
      include: INCLUDE,
    });
  }

  async remove(id: number) {
    const office = await this.findOne(id);
    if (office.status !== "VACANT") {
      throw new BadRequestException("Only vacant offices can be deleted");
    }
    await this.prisma.mpOffice.delete({ where: { id } });
    return { message: "Deleted" };
  }
}
