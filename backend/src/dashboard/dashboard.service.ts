import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface OccupancyCounts { occupied: number; vacant: number; maintenance: number }

function buildPivot(
  rows: Array<{ status: string; _count: { _all: number } }>,
  getId: (r: any) => number,
): Map<number, OccupancyCounts> {
  const map = new Map<number, OccupancyCounts>();
  for (const row of rows) {
    const id = getId(row);
    if (!map.has(id)) map.set(id, { occupied: 0, vacant: 0, maintenance: 0 });
    const e = map.get(id)!;
    if (row.status === "OCCUPIED")          e.occupied    += row._count._all;
    else if (row.status === "VACANT")       e.vacant      += row._count._all;
    else if (row.status === "UNDER_MAINTENANCE") e.maintenance += row._count._all;
  }
  return map;
}

function statusCount(arr: Array<{ status: string; _count: { _all: number } }>, status: string) {
  return arr.find((a) => a.status === status)?._count._all ?? 0;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      mpTotal,
      staffTotal,
      staffByClass,
      officeByStatus,
      flatByStatus,
      quarterByStatus,
      allocByType,
      recentAllocations,
      quartersByCatStatus,
      flatsByCatStatus,
      officesByBldgStatus,
    ] = await Promise.all([
      this.prisma.mp.count(),
      this.prisma.staff.count(),
      this.prisma.staff.groupBy({ by: ["employee_class"], _count: { _all: true } }),
      this.prisma.mpOffice.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.mpFlat.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.staffQuarter.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.allocation.groupBy({
        by: ["allocation_type"],
        where: { status: "ACTIVE" },
        _count: { _all: true },
      }),
      this.prisma.allocation.findMany({
        where: { status: "ACTIVE" },
        orderBy: { created_at: "desc" },
        take: 8,
        select: {
          id: true,
          allocation_type: true,
          occupant_type: true,
          allotment_date: true,
          mp:    { select: { name_en: true, name_bn: true, parliament_number: true } },
          staff: { select: { name_en: true, name_bn: true, internal_user_id: true } },
          mp_office:    { select: { room_number: true, building: { select: { name_en: true, name_bn: true } } } },
          mp_flat:      { select: { flat_number: true, building_name: true } },
          staff_quarter: { select: { quarter_number: true, location: true } },
        },
      }),
      this.prisma.staffQuarter.groupBy({ by: ["category_id", "status"], _count: { _all: true } }),
      this.prisma.mpFlat.groupBy({ by: ["category_id", "status"], _count: { _all: true } }),
      this.prisma.mpOffice.groupBy({ by: ["building_id", "status"], _count: { _all: true } }),
    ]);

    // Collect unique IDs for name lookups
    const quarterCatIds = Array.from(new Set(quartersByCatStatus.map((r) => r.category_id))) as number[];
    const flatCatIds    = Array.from(new Set(flatsByCatStatus.map((r) => r.category_id)))    as number[];
    const buildingIds   = Array.from(new Set(officesByBldgStatus.map((r) => r.building_id))) as number[];

    const [quarterCats, flatCats, buildings] = await Promise.all([
      this.prisma.staffQuarterCategory.findMany({ where: { id: { in: quarterCatIds } }, select: { id: true, name_en: true, name_bn: true } }),
      this.prisma.mpFlatCategory.findMany(      { where: { id: { in: flatCatIds } },    select: { id: true, name_en: true, name_bn: true } }),
      this.prisma.mpOfficeBuilding.findMany(    { where: { id: { in: buildingIds } },   select: { id: true, name_en: true, name_bn: true } }),
    ]);

    const quarterCatMap = Object.fromEntries(quarterCats.map((c) => [c.id, c]));
    const flatCatMap    = Object.fromEntries(flatCats.map((c) => [c.id, c]));
    const buildingMap   = Object.fromEntries(buildings.map((b) => [b.id, b]));

    // Build pivot maps
    const quarterPivot = buildPivot(quartersByCatStatus as any, (r) => r.category_id as number);
    const flatPivot    = buildPivot(flatsByCatStatus    as any, (r) => r.category_id as number);
    const officePivot  = buildPivot(officesByBldgStatus as any, (r) => r.building_id  as number);

    const toStat = (pivot: Map<number, OccupancyCounts>, id: number, name_en: string, name_bn: string) => {
      const c = pivot.get(id) ?? { occupied: 0, vacant: 0, maintenance: 0 };
      return { name_en, name_bn, ...c, total: c.occupied + c.vacant + c.maintenance };
    };

    return {
      mps:   { total: mpTotal },
      staff: {
        total: staffTotal,
        by_class: staffByClass.map((s) => ({ class: s.employee_class, count: s._count._all })),
      },
      assets: {
        offices:  { total: officeByStatus.reduce((s, a) => s + a._count._all, 0),  occupied: statusCount(officeByStatus  as any, "OCCUPIED"), vacant: statusCount(officeByStatus  as any, "VACANT"), maintenance: statusCount(officeByStatus  as any, "UNDER_MAINTENANCE") },
        flats:    { total: flatByStatus.reduce((s, a) => s + a._count._all, 0),    occupied: statusCount(flatByStatus    as any, "OCCUPIED"), vacant: statusCount(flatByStatus    as any, "VACANT"), maintenance: statusCount(flatByStatus    as any, "UNDER_MAINTENANCE") },
        quarters: { total: quarterByStatus.reduce((s, a) => s + a._count._all, 0), occupied: statusCount(quarterByStatus as any, "OCCUPIED"), vacant: statusCount(quarterByStatus as any, "VACANT"), maintenance: statusCount(quarterByStatus as any, "UNDER_MAINTENANCE") },
      },
      quarters_by_category:  quarterCatIds.map((id) => toStat(quarterPivot, id, quarterCatMap[id]?.name_en ?? `Cat ${id}`, quarterCatMap[id]?.name_bn ?? `বিভাগ ${id}`)),
      flats_by_category:     flatCatIds.map((id)    => toStat(flatPivot,    id, flatCatMap[id]?.name_en    ?? `Cat ${id}`, flatCatMap[id]?.name_bn    ?? `বিভাগ ${id}`)),
      offices_by_building:   buildingIds.map((id)   => toStat(officePivot,  id, buildingMap[id]?.name_en   ?? `Bldg ${id}`, buildingMap[id]?.name_bn  ?? `ভবন ${id}`)),
      allocations: {
        total_active: allocByType.reduce((s, a) => s + a._count._all, 0),
        by_type: allocByType.map((a) => ({ type: a.allocation_type, count: a._count._all })),
      },
      recent_allocations: recentAllocations,
    };
  }
}
