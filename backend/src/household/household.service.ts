import {
  Injectable, NotFoundException, BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { CreateHouseholdMemberDto, UpdateHouseholdMemberDto } from "./dto/household.dto";

const MEMBER_INCLUDE = {
  relation_type: true,
  staff: { select: { id: true, name_en: true, name_bn: true } },
  allocation: { select: { id: true, allocation_type: true, allotment_date: true } },
};

@Injectable()
export class HouseholdService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(dto: CreateHouseholdMemberDto) {
    // verify staff exists
    const staff = await this.prisma.staff.findUnique({ where: { id: dto.staff_id } });
    if (!staff) throw new NotFoundException(`Staff #${dto.staff_id} not found`);

    // verify allocation exists and belongs to this staff
    const alloc = await this.prisma.allocation.findUnique({ where: { id: dto.allocation_id } });
    if (!alloc) throw new NotFoundException(`Allocation #${dto.allocation_id} not found`);
    if (alloc.staff_id !== dto.staff_id) {
      throw new BadRequestException("Allocation does not belong to this staff member");
    }
    if (alloc.status !== "ACTIVE") {
      throw new BadRequestException("Cannot add household member to a vacated allocation");
    }

    return this.prisma.householdMember.create({
      data: {
        staff_id:        dto.staff_id,
        allocation_id:   dto.allocation_id,
        name_bn:         dto.name_bn,
        name_en:         dto.name_en,
        relation_type_id: dto.relation_type_id,
        date_of_birth:   dto.date_of_birth ? new Date(dto.date_of_birth) : undefined,
        identity_number: dto.identity_number,
      },
      include: MEMBER_INCLUDE,
    });
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateHouseholdMemberDto) {
    await this.#findActiveOrFail(id);
    return this.prisma.householdMember.update({
      where: { id },
      data: {
        ...(dto.name_bn           && { name_bn: dto.name_bn }),
        ...(dto.name_en           && { name_en: dto.name_en }),
        ...(dto.relation_type_id  && { relation_type_id: dto.relation_type_id }),
        ...(dto.date_of_birth     && { date_of_birth: new Date(dto.date_of_birth) }),
        ...(dto.identity_number !== undefined && { identity_number: dto.identity_number }),
      },
      include: MEMBER_INCLUDE,
    });
  }

  // ─── REMOVE (soft-delete) ─────────────────────────────────────────────────

  async remove(id: number) {
    await this.#findActiveOrFail(id);
    return this.prisma.householdMember.update({
      where: { id },
      data: { is_active: false },
      include: MEMBER_INCLUDE,
    });
  }

  // ─── PHOTO UPLOAD ─────────────────────────────────────────────────────────

  async uploadPhoto(id: number, file: Express.Multer.File) {
    const member = await this.#findActiveOrFail(id);
    if (member.photo_path) await this.storage.deletePhoto(member.photo_path);
    const photoPath = await this.storage.uploadPhoto(file, "household");
    return this.prisma.householdMember.update({
      where: { id },
      data: { photo_path: photoPath },
      include: MEMBER_INCLUDE,
    });
  }

  // ─── QUERIES ──────────────────────────────────────────────────────────────

  /** Active household members for a staff member */
  listForStaff(staffId: number) {
    return this.prisma.householdMember.findMany({
      where: { staff_id: staffId, is_active: true },
      include: MEMBER_INCLUDE,
      orderBy: { created_at: "asc" },
    });
  }

  /** Active household members under a specific allocation (quarter) */
  listForAllocation(allocationId: number) {
    return this.prisma.householdMember.findMany({
      where: { allocation_id: allocationId, is_active: true },
      include: MEMBER_INCLUDE,
      orderBy: { created_at: "asc" },
    });
  }

  async findOne(id: number) {
    const m = await this.prisma.householdMember.findUnique({ where: { id }, include: MEMBER_INCLUDE });
    if (!m) throw new NotFoundException(`Household member #${id} not found`);
    return m;
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  async #findActiveOrFail(id: number) {
    const m = await this.prisma.householdMember.findUnique({ where: { id } });
    if (!m) throw new NotFoundException(`Household member #${id} not found`);
    if (!m.is_active) throw new BadRequestException(`Household member #${id} has already been removed`);
    return m;
  }
}
