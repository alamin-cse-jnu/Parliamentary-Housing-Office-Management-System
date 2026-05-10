import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLookupDto, UpdateLookupDto } from "./dto/lookup.dto";

// Maps route segment → Prisma model delegate accessor
const MODEL_MAP = {
  "mp-flat-categories":      "mpFlatCategory",
  "quarter-categories":      "staffQuarterCategory",
  "political-parties":       "politicalParty",
  "departments":             "department",
  "mp-designations":         "mpDesignation",
  "office-buildings":        "mpOfficeBuilding",
  "relation-types":          "householdRelationType",
  "staff-designations":      "staffDesignationType",
} as const;

export type LookupType = keyof typeof MODEL_MAP;

@Injectable()
export class LookupsService {
  constructor(private prisma: PrismaService) {}

  private model(type: LookupType) {
    const key = MODEL_MAP[type];
    return (this.prisma as any)[key];
  }

  async findAll(type: LookupType) {
    const hasSortOrder = type !== "departments" && type !== "political-parties" && type !== "office-buildings";
    return this.model(type).findMany({
      orderBy: hasSortOrder ? { sort_order: "asc" } : { name_en: "asc" },
    });
  }

  async findOne(type: LookupType, id: number) {
    const record = await this.model(type).findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`${type} #${id} not found`);
    return record;
  }

  async create(type: LookupType, dto: CreateLookupDto) {
    return this.model(type).create({ data: dto });
  }

  async update(type: LookupType, id: number, dto: UpdateLookupDto) {
    await this.findOne(type, id);
    return this.model(type).update({ where: { id }, data: dto });
  }

  async remove(type: LookupType, id: number) {
    await this.findOne(type, id);
    try {
      await this.model(type).delete({ where: { id } });
      return { message: "Deleted" };
    } catch {
      throw new ConflictException("Cannot delete — record is in use");
    }
  }
}
