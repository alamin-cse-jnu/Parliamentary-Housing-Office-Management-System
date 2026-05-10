import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMpFlatDto, UpdateMpFlatDto } from "./dto/mp-flat.dto";
import { UpdateAssetStatusDto } from "../office/dto/office.dto";

const INCLUDE = { category: true };

@Injectable()
export class MpFlatService {
  constructor(private prisma: PrismaService) {}

  findAll(query: { category_id?: number; building_name?: string; status?: string }) {
    return this.prisma.mpFlat.findMany({
      where: {
        ...(query.category_id  && { category_id: query.category_id }),
        ...(query.building_name && { building_name: { contains: query.building_name, mode: "insensitive" } }),
        ...(query.status       && { status: query.status as any }),
      },
      include: INCLUDE,
      orderBy: [{ category_id: "asc" }, { building_name: "asc" }, { flat_number: "asc" }],
    });
  }

  async findOne(id: number) {
    const flat = await this.prisma.mpFlat.findUnique({ where: { id }, include: INCLUDE });
    if (!flat) throw new NotFoundException(`Flat #${id} not found`);
    return flat;
  }

  async create(dto: CreateMpFlatDto) {
    const exists = await this.prisma.mpFlat.findUnique({
      where: { building_name_flat_number: { building_name: dto.building_name, flat_number: dto.flat_number } },
    });
    if (exists) throw new ConflictException(`Flat ${dto.flat_number} already exists in building "${dto.building_name}"`);
    return this.prisma.mpFlat.create({ data: dto as any, include: INCLUDE });
  }

  async update(id: number, dto: UpdateMpFlatDto) {
    const flat = await this.findOne(id);
    const building = dto.building_name ?? flat.building_name;
    const flatNo   = dto.flat_number   ?? flat.flat_number;
    if (dto.building_name || dto.flat_number) {
      const conflict = await this.prisma.mpFlat.findUnique({
        where: { building_name_flat_number: { building_name: building, flat_number: flatNo } },
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Flat ${flatNo} already exists in building "${building}"`);
      }
    }
    return this.prisma.mpFlat.update({ where: { id }, data: dto as any, include: INCLUDE });
  }

  async updateStatus(id: number, dto: UpdateAssetStatusDto) {
    await this.findOne(id);
    return this.prisma.mpFlat.update({ where: { id }, data: { status: dto.status as any }, include: INCLUDE });
  }

  async remove(id: number) {
    const flat = await this.findOne(id);
    if (flat.status !== "VACANT") throw new BadRequestException("Only vacant flats can be deleted");
    await this.prisma.mpFlat.delete({ where: { id } });
    return { message: "Deleted" };
  }
}
