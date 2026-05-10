import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuarterDto, UpdateQuarterDto } from "./dto/quarter.dto";
import { UpdateAssetStatusDto } from "../office/dto/office.dto";

const INCLUDE = { category: true };

// CLAUDE.md full_address format:
// "CategoryName - QuarterNo, House/FlatNo, Location"  OR
// "CategoryName - QuarterNo, Location"
function buildFullAddress(
  categoryName: string,
  quarterNumber: string,
  location: string,
  houseFlatNumber?: string | null,
): string {
  const base = `${categoryName} - ${quarterNumber}`;
  return houseFlatNumber
    ? `${base}, ${houseFlatNumber}, ${location}`
    : `${base}, ${location}`;
}

@Injectable()
export class QuarterService {
  constructor(private prisma: PrismaService) {}

  findAll(query: { category_id?: number; location?: string; status?: string }) {
    return this.prisma.staffQuarter.findMany({
      where: {
        ...(query.category_id && { category_id: query.category_id }),
        ...(query.location    && { location: { contains: query.location, mode: "insensitive" } }),
        ...(query.status      && { status: query.status as any }),
      },
      include: INCLUDE,
      orderBy: [{ category_id: "asc" }, { quarter_number: "asc" }],
    });
  }

  async findOne(id: number) {
    const q = await this.prisma.staffQuarter.findUnique({ where: { id }, include: INCLUDE });
    if (!q) throw new NotFoundException(`Quarter #${id} not found`);
    return q;
  }

  async create(dto: CreateQuarterDto) {
    const exists = await this.prisma.staffQuarter.findUnique({
      where: { category_id_quarter_number: { category_id: dto.category_id, quarter_number: dto.quarter_number } },
    });
    if (exists) throw new ConflictException(`Quarter ${dto.quarter_number} already exists in this category`);

    const category = await this.prisma.staffQuarterCategory.findUnique({ where: { id: dto.category_id } });
    if (!category) throw new BadRequestException(`Category #${dto.category_id} not found`);

    const full_address = buildFullAddress(category.name_en, dto.quarter_number, dto.location, dto.house_flat_number);

    return this.prisma.staffQuarter.create({
      data: { ...dto, full_address } as any,
      include: INCLUDE,
    });
  }

  async update(id: number, dto: UpdateQuarterDto) {
    const quarter = await this.findOne(id);

    if (dto.quarter_number || dto.category_id) {
      const catId  = dto.category_id   ?? quarter.category_id;
      const qNum   = dto.quarter_number ?? quarter.quarter_number;
      const conflict = await this.prisma.staffQuarter.findUnique({
        where: { category_id_quarter_number: { category_id: catId, quarter_number: qNum } },
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Quarter ${qNum} already exists in this category`);
      }
    }

    // Recompute full_address if any address fields changed
    const catId      = dto.category_id     ?? quarter.category_id;
    const qNum       = dto.quarter_number  ?? quarter.quarter_number;
    const loc        = dto.location        ?? quarter.location;
    const houseFlatNo = dto.house_flat_number !== undefined ? dto.house_flat_number : quarter.house_flat_number;

    const category = await this.prisma.staffQuarterCategory.findUnique({ where: { id: catId } });
    const full_address = buildFullAddress(category!.name_en, qNum, loc, houseFlatNo);

    return this.prisma.staffQuarter.update({
      where: { id },
      data: { ...dto, full_address } as any,
      include: INCLUDE,
    });
  }

  async updateStatus(id: number, dto: UpdateAssetStatusDto) {
    await this.findOne(id);
    return this.prisma.staffQuarter.update({
      where: { id },
      data: { status: dto.status as any },
      include: INCLUDE,
    });
  }

  async remove(id: number) {
    const quarter = await this.findOne(id);
    if (quarter.status !== "VACANT") throw new BadRequestException("Only vacant quarters can be deleted");
    await this.prisma.staffQuarter.delete({ where: { id } });
    return { message: "Deleted" };
  }
}
