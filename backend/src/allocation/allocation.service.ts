import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAllocationDto, VacateAllocationDto } from "./dto/allocation.dto";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type AllocType = "OFFICE" | "MP_FLAT" | "STAFF_QUARTER";
type OccupantType = "MP" | "STAFF";

/** Returns the Prisma model delegate and FK column name for each asset type */
function assetMeta(type: AllocType): {
  model: string;
  fkCol: "mp_office_id" | "mp_flat_id" | "quarter_id";
} {
  switch (type) {
    case "OFFICE":        return { model: "mpOffice",     fkCol: "mp_office_id" };
    case "MP_FLAT":       return { model: "mpFlat",       fkCol: "mp_flat_id"   };
    case "STAFF_QUARTER": return { model: "staffQuarter", fkCol: "quarter_id"   };
  }
}

/** Returns the Prisma model and FK column name for each occupant type */
function occupantMeta(type: OccupantType): {
  model: string;
  fkCol: "mp_id" | "staff_id";
} {
  return type === "MP"
    ? { model: "mp",    fkCol: "mp_id"    }
    : { model: "staff", fkCol: "staff_id" };
}

const ALLOC_INCLUDE = {
  mp_office:     { include: { building: true } },
  mp_flat:       { include: { category: true } },
  staff_quarter: { include: { category: true } },
  mp:            { select: { id: true, name_en: true, name_bn: true, parliament_number: true } },
  staff:         { select: { id: true, name_en: true, name_bn: true, internal_user_id: true, designation: true } },
};

@Injectable()
export class AllocationService {
  constructor(private prisma: PrismaService) {}

  // ─── CREATE ALLOCATION ────────────────────────────────────────────────────

  async create(dto: CreateAllocationDto, createdBy: number) {
    const { model: assetModel, fkCol: assetFk } = assetMeta(dto.allocation_type as AllocType);
    const { model: occupantModel, fkCol: occupantFk } = occupantMeta(dto.occupant_type as OccupantType);

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify asset exists and is VACANT
      const asset = await (tx as any)[assetModel].findUnique({ where: { id: dto.asset_id } });
      if (!asset) throw new NotFoundException(`Asset #${dto.asset_id} not found`);
      if (asset.status !== "VACANT") {
        throw new BadRequestException(
          `Asset is ${asset.status} — only VACANT assets can be allocated`,
        );
      }

      // 2. Verify occupant exists
      const occupant = await (tx as any)[occupantModel].findUnique({ where: { id: dto.occupant_id } });
      if (!occupant) throw new NotFoundException(`Occupant #${dto.occupant_id} not found`);

      // 3. Create allocation record
      let allocation;
      try {
        allocation = await tx.allocation.create({
          data: {
            allocation_type: dto.allocation_type as any,
            occupant_type:   dto.occupant_type as any,
            [assetFk]:       dto.asset_id,
            [occupantFk]:    dto.occupant_id,
            allotment_date:  new Date(dto.allotment_date),
            remarks:         dto.remarks,
            status:          "ACTIVE",
            created_by:      createdBy,
          },
          include: ALLOC_INCLUDE,
        });
      } catch (e: any) {
        if (e.code === "P2002") {
          throw new ConflictException("Asset already has an active allocation");
        }
        throw e;
      }

      // 4. Mark asset as OCCUPIED
      await (tx as any)[assetModel].update({
        where: { id: dto.asset_id },
        data: { status: "OCCUPIED" },
      });

      return allocation;
    });
  }

  // ─── VACATE ALLOCATION ────────────────────────────────────────────────────

  async vacate(id: number, dto: VacateAllocationDto) {
    const allocation = await this.prisma.allocation.findUnique({ where: { id } });
    if (!allocation) throw new NotFoundException(`Allocation #${id} not found`);
    if (allocation.status === "VACATED") {
      throw new BadRequestException("Allocation is already vacated");
    }

    const { model: assetModel, fkCol: assetFk } = assetMeta(allocation.allocation_type as AllocType);
    const assetId: number = (allocation as any)[assetFk];

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.allocation.update({
        where: { id },
        data: {
          status:       "VACATED",
          vacated_date: new Date(dto.vacated_date),
          ...(dto.remarks && { remarks: dto.remarks }),
        },
        include: ALLOC_INCLUDE,
      });

      await (tx as any)[assetModel].update({
        where: { id: assetId },
        data: { status: "VACANT" },
      });

      return updated;
    });
  }

  // ─── QUERIES ─────────────────────────────────────────────────────────────

  /** Current active allocation for an asset */
  async getCurrentForAsset(type: AllocType, assetId: number) {
    const { fkCol } = assetMeta(type);
    return this.prisma.allocation.findFirst({
      where: { [fkCol]: assetId, status: "ACTIVE" },
      include: ALLOC_INCLUDE,
    });
  }

  /** Full history for an asset (active + vacated) */
  async getHistoryForAsset(type: AllocType, assetId: number) {
    const { fkCol } = assetMeta(type);
    return this.prisma.allocation.findMany({
      where: { [fkCol]: assetId },
      include: ALLOC_INCLUDE,
      orderBy: { allotment_date: "desc" },
    });
  }

  /** All active allocations for an MP */
  getForMp(mpId: number) {
    return this.prisma.allocation.findMany({
      where: { mp_id: mpId, status: "ACTIVE" },
      include: ALLOC_INCLUDE,
      orderBy: { allotment_date: "desc" },
    });
  }

  /** Full allocation history (active + vacated) for an MP */
  getAllHistoryForMp(mpId: number) {
    return this.prisma.allocation.findMany({
      where: { mp_id: mpId },
      include: ALLOC_INCLUDE,
      orderBy: { allotment_date: "desc" },
    });
  }

  /** All active allocations for a staff member */
  getForStaff(staffId: number) {
    return this.prisma.allocation.findMany({
      where: { staff_id: staffId, status: "ACTIVE" },
      include: ALLOC_INCLUDE,
      orderBy: { allotment_date: "desc" },
    });
  }

  /** Full allocation history (active + vacated) for a staff member */
  getAllHistoryForStaff(staffId: number) {
    return this.prisma.allocation.findMany({
      where: { staff_id: staffId },
      include: ALLOC_INCLUDE,
      orderBy: { allotment_date: "desc" },
    });
  }

  /** Single allocation detail */
  async findOne(id: number) {
    const alloc = await this.prisma.allocation.findUnique({ where: { id }, include: ALLOC_INCLUDE });
    if (!alloc) throw new NotFoundException(`Allocation #${id} not found`);
    return alloc;
  }

  /** All allocations — filterable */
  findAll(query: { type?: string; status?: string; occupant_type?: string }) {
    return this.prisma.allocation.findMany({
      where: {
        ...(query.type          && { allocation_type: query.type as any }),
        ...(query.status        && { status: query.status as any }),
        ...(query.occupant_type && { occupant_type: query.occupant_type as any }),
      },
      include: ALLOC_INCLUDE,
      orderBy: { allotment_date: "desc" },
    });
  }
}
