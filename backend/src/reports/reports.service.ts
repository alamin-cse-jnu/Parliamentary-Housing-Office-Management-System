import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { ReportColumn } from "./excel.service";

// ─── Column definitions ───────────────────────────────────────────────────────

export const R01_COLS: ReportColumn[] = [
  { key: "category",      label_en: "Category",         label_bn: "ক্যাটাগরি" },
  { key: "quarter_no",    label_en: "Quarter No.",       label_bn: "কোয়ার্টার নং" },
  { key: "location",      label_en: "Location",          label_bn: "অবস্থান" },
  { key: "house_flat_no", label_en: "House/Flat No.",    label_bn: "বাড়ি/ফ্ল্যাট নং" },
  { key: "area_sqft",     label_en: "Area (sqft)",       label_bn: "আয়তন (বর্গফুট)" },
  { key: "floor",         label_en: "Floor",             label_bn: "তলা" },
  { key: "building",      label_en: "Building",          label_bn: "ভবন" },
  { key: "full_address",  label_en: "Full Address",      label_bn: "সম্পূর্ণ ঠিকানা" },
  { key: "staff_name",    label_en: "Officer Name",      label_bn: "কর্মকর্তার নাম" },
  { key: "designation",   label_en: "Designation",       label_bn: "পদবী" },
  { key: "allotment_date",label_en: "Allotment Date",    label_bn: "বরাদ্দের তারিখ" },
  { key: "vacated_date",  label_en: "Vacated Date",      label_bn: "খালি করার তারিখ" },
  { key: "status",        label_en: "Status",            label_bn: "অবস্থা" },
];

export const R02_COLS: ReportColumn[] = [
  { key: "category",      label_en: "Category",         label_bn: "ক্যাটাগরি" },
  { key: "quarter_no",    label_en: "Quarter No.",       label_bn: "কোয়ার্টার নং" },
  { key: "location",      label_en: "Location",          label_bn: "অবস্থান" },
  { key: "full_address",  label_en: "Full Address",      label_bn: "সম্পূর্ণ ঠিকানা" },
  { key: "status",        label_en: "Status",            label_bn: "অবস্থা" },
  { key: "staff_name",    label_en: "Current Occupant",  label_bn: "বর্তমান বাসিন্দা" },
  { key: "allotment_date",label_en: "Allotment Date",    label_bn: "বরাদ্দের তারিখ" },
];

export const R03_COLS: ReportColumn[] = [
  { key: "staff_name",    label_en: "Officer Name",      label_bn: "কর্মকর্তার নাম" },
  { key: "user_id",       label_en: "User ID",           label_bn: "ইউজার আইডি" },
  { key: "designation",   label_en: "Designation",       label_bn: "পদবী" },
  { key: "department",    label_en: "Department",        label_bn: "দপ্তর" },
  { key: "grade",         label_en: "Grade",             label_bn: "গ্রেড" },
  { key: "category",      label_en: "Quarter Category",  label_bn: "কোয়ার্টার ক্যাটাগরি" },
  { key: "quarter_no",    label_en: "Quarter No.",       label_bn: "কোয়ার্টার নং" },
  { key: "location",      label_en: "Location",          label_bn: "অবস্থান" },
  { key: "allotment_date",label_en: "Allotment Date",    label_bn: "বরাদ্দের তারিখ" },
];

export const R04_COLS: ReportColumn[] = [
  { key: "member_name",   label_en: "Member Name",       label_bn: "সদস্যের নাম" },
  { key: "relation",      label_en: "Relation",          label_bn: "সম্পর্ক" },
  { key: "dob",           label_en: "Date of Birth",     label_bn: "জন্ম তারিখ" },
  { key: "identity_no",   label_en: "Identity No.",      label_bn: "পরিচয় নং" },
  { key: "staff_name",    label_en: "Officer",           label_bn: "কর্মকর্তা" },
  { key: "quarter_no",    label_en: "Quarter No.",       label_bn: "কোয়ার্টার নং" },
  { key: "location",      label_en: "Location",          label_bn: "অবস্থান" },
];

export const R05_COLS: ReportColumn[] = [
  { key: "quarter_no",    label_en: "Quarter No.",       label_bn: "কোয়ার্টার নং" },
  { key: "location",      label_en: "Location",          label_bn: "অবস্থান" },
  { key: "staff_name",    label_en: "Officer Name",      label_bn: "কর্মকর্তার নাম" },
  { key: "designation",   label_en: "Designation",       label_bn: "পদবী" },
  { key: "allotment_date",label_en: "Allotment Date",    label_bn: "বরাদ্দের তারিখ" },
  { key: "vacated_date",  label_en: "Vacated Date",      label_bn: "খালি করার তারিখ" },
  { key: "duration_days", label_en: "Duration (days)",   label_bn: "মেয়াদ (দিন)" },
  { key: "status",        label_en: "Status",            label_bn: "অবস্থা" },
];

export const R06_COLS: ReportColumn[] = [
  { key: "mp_name",       label_en: "MP Name",           label_bn: "সংসদ সদস্যের নাম" },
  { key: "parl_no",       label_en: "Parliament No.",    label_bn: "সংসদ নম্বর" },
  { key: "party",         label_en: "Party",             label_bn: "দল" },
  { key: "constituency",  label_en: "Constituency",      label_bn: "নির্বাচনী এলাকা" },
  { key: "office_building",label_en:"Office Building",   label_bn: "অফিস ভবন" },
  { key: "office_room",   label_en: "Office Room",       label_bn: "অফিস কক্ষ" },
  { key: "flat_category", label_en: "Flat Category",     label_bn: "ফ্ল্যাট ক্যাটাগরি" },
  { key: "flat_number",   label_en: "Flat No.",          label_bn: "ফ্ল্যাট নং" },
  { key: "flat_allotment",label_en: "Flat Allotment",    label_bn: "ফ্ল্যাট বরাদ্দ" },
];

export const R07_COLS: ReportColumn[] = [
  { key: "category",      label_en: "Category",         label_bn: "ক্যাটাগরি" },
  { key: "flat_number",   label_en: "Flat No.",          label_bn: "ফ্ল্যাট নং" },
  { key: "building",      label_en: "Building",          label_bn: "ভবন" },
  { key: "floor",         label_en: "Floor",             label_bn: "তলা" },
  { key: "area_sqft",     label_en: "Area (sqft)",       label_bn: "আয়তন (বর্গফুট)" },
  { key: "status",        label_en: "Status",            label_bn: "অবস্থা" },
  { key: "mp_name",       label_en: "MP Name",           label_bn: "সংসদ সদস্যের নাম" },
  { key: "allotment_date",label_en: "Allotment Date",    label_bn: "বরাদ্দের তারিখ" },
];

export const R08_COLS: ReportColumn[] = [
  { key: "asset_type",    label_en: "Asset Type",        label_bn: "সম্পদের ধরন" },
  { key: "category",      label_en: "Category",          label_bn: "ক্যাটাগরি" },
  { key: "identifier",    label_en: "Identifier",        label_bn: "পরিচিতি" },
  { key: "location",      label_en: "Location/Building", label_bn: "অবস্থান/ভবন" },
  { key: "status",        label_en: "Status",            label_bn: "অবস্থা" },
];

export const R10_COLS: ReportColumn[] = [
  { key: "asset_type",    label_en: "Asset Type",        label_bn: "সম্পদের ধরন" },
  { key: "category",      label_en: "Category",          label_bn: "ক্যাটাগরি" },
  { key: "total",         label_en: "Total",             label_bn: "মোট" },
  { key: "occupied",      label_en: "Occupied",          label_bn: "অধিকৃত" },
  { key: "vacant",        label_en: "Vacant",            label_bn: "খালি" },
  { key: "maintenance",   label_en: "Under Maintenance", label_bn: "মেরামতাধীন" },
];

export const R11_COLS: ReportColumn[] = [
  { key: "mp_name",       label_en: "MP Name",           label_bn: "সংসদ সদস্যের নাম" },
  { key: "parl_no",       label_en: "Parliament No.",    label_bn: "সংসদ নম্বর" },
  { key: "constituency",  label_en: "Constituency",      label_bn: "নির্বাচনী এলাকা" },
  { key: "party",         label_en: "Party",             label_bn: "দল" },
  { key: "office_vacated",label_en: "Office Vacated",    label_bn: "অফিস খালি" },
  { key: "flat_vacated",  label_en: "Flat Vacated",      label_bn: "ফ্ল্যাট খালি" },
  { key: "mp_status",     label_en: "MP Status",         label_bn: "এমপি অবস্থা" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB");
}

function daysDiff(from: Date, to: Date | null | undefined): string {
  if (!to) return "";
  return String(Math.round((to.getTime() - from.getTime()) / 86400000));
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ─── R-01: Quarter Detail ─────────────────────────────────────────────────

  async r01(lang: "en" | "bn", filters: { category_id?: number; quarter_id?: number }) {
    const quarters = await this.prisma.staffQuarter.findMany({
      where: {
        ...(filters.category_id && { category_id: filters.category_id }),
        ...(filters.quarter_id  && { id: filters.quarter_id }),
      },
      include: {
        category: true,
        allocations: {
          orderBy: { allotment_date: "desc" },
          include: {
            staff: true,
            household_members: { where: { is_active: true }, include: { relation_type: true } },
          },
        },
      },
      orderBy: [{ category_id: "asc" }, { quarter_number: "asc" }],
    });

    const rows: Record<string, unknown>[] = [];
    for (const q of quarters) {
      const lastAlloc = q.allocations[0] ?? null;
      rows.push({
        category:       lang === "bn" ? (q.category as any).name_bn : (q.category as any).name_en,
        quarter_no:     q.quarter_number,
        location:       q.location,
        house_flat_no:  q.house_flat_number ?? "",
        area_sqft:      q.area_sqft ?? "",
        floor:          q.floor ?? "",
        building:       q.building_name ?? "",
        full_address:   q.full_address ?? "",
        staff_name:     lastAlloc ? (lang === "bn" ? lastAlloc.staff?.name_bn : lastAlloc.staff?.name_en) ?? "" : "",
        designation:    lastAlloc?.staff?.designation ?? "",
        allotment_date: fmtDate(lastAlloc?.allotment_date),
        vacated_date:   fmtDate(lastAlloc?.vacated_date),
        status:         q.status,
      });
    }
    return rows;
  }

  // ─── R-02: All Quarters Occupancy Status ─────────────────────────────────

  async r02(lang: "en" | "bn", filters: { category_id?: number; status?: string }) {
    const quarters = await this.prisma.staffQuarter.findMany({
      where: {
        ...(filters.category_id && { category_id: filters.category_id }),
        ...(filters.status      && { status: filters.status as any }),
      },
      include: {
        category: true,
        allocations: {
          where: { status: "ACTIVE" },
          include: { staff: true },
          take: 1,
        },
      },
      orderBy: [{ category_id: "asc" }, { quarter_number: "asc" }],
    });

    return quarters.map((q) => {
      const active = q.allocations[0] ?? null;
      return {
        category:       lang === "bn" ? (q.category as any).name_bn : (q.category as any).name_en,
        quarter_no:     q.quarter_number,
        location:       q.location,
        full_address:   q.full_address ?? "",
        status:         q.status,
        staff_name:     active ? (lang === "bn" ? active.staff?.name_bn : active.staff?.name_en) ?? "" : "",
        allotment_date: fmtDate(active?.allotment_date),
      };
    });
  }

  // ─── R-03: Staff Housing Directory ───────────────────────────────────────

  async r03(lang: "en" | "bn", filters: { category_id?: number; department_id?: number; status?: string }) {
    const allocations = await this.prisma.allocation.findMany({
      where: {
        allocation_type: "STAFF_QUARTER",
        ...(filters.status ? { status: filters.status as any } : { status: "ACTIVE" }),
        staff: filters.department_id ? { department_id: filters.department_id } : undefined,
        staff_quarter: filters.category_id ? { category_id: filters.category_id } : undefined,
      },
      include: {
        staff: { include: { department: true } },
        staff_quarter: { include: { category: true } },
      },
      orderBy: { allotment_date: "asc" },
    });

    return allocations.map((a) => ({
      staff_name:    lang === "bn" ? a.staff?.name_bn : a.staff?.name_en,
      user_id:       a.staff?.internal_user_id ?? "",
      designation:   a.staff?.designation ?? "",
      department:    lang === "bn" ? (a.staff?.department as any)?.name_bn : (a.staff?.department as any)?.name_en,
      grade:         a.staff?.grade ?? "",
      category:      lang === "bn" ? (a.staff_quarter?.category as any)?.name_bn : (a.staff_quarter?.category as any)?.name_en,
      quarter_no:    a.staff_quarter?.quarter_number ?? "",
      location:      a.staff_quarter?.location ?? "",
      allotment_date:fmtDate(a.allotment_date),
    }));
  }

  // ─── R-04: Household Member List ─────────────────────────────────────────

  async r04(lang: "en" | "bn", filters: { allocation_id?: number; staff_id?: number }) {
    const members = await this.prisma.householdMember.findMany({
      where: {
        is_active: true,
        ...(filters.staff_id      && { staff_id: filters.staff_id }),
        ...(filters.allocation_id && { allocation_id: filters.allocation_id }),
      },
      include: {
        relation_type: true,
        staff: true,
        allocation: { include: { staff_quarter: true } },
      },
      orderBy: { created_at: "asc" },
    });

    return members.map((m) => ({
      member_name: lang === "bn" ? m.name_bn : m.name_en,
      relation:    lang === "bn" ? (m.relation_type as any)?.name_bn : (m.relation_type as any)?.name_en,
      dob:         fmtDate(m.date_of_birth),
      identity_no: m.identity_number ?? "",
      staff_name:  lang === "bn" ? m.staff?.name_bn : m.staff?.name_en,
      quarter_no:  (m.allocation as any)?.staff_quarter?.quarter_number ?? "",
      location:    (m.allocation as any)?.staff_quarter?.location ?? "",
    }));
  }

  // ─── R-05: Quarter Occupancy History ─────────────────────────────────────

  async r05(lang: "en" | "bn", filters: { quarter_id?: number }) {
    const allocations = await this.prisma.allocation.findMany({
      where: {
        allocation_type: "STAFF_QUARTER",
        ...(filters.quarter_id && { quarter_id: filters.quarter_id }),
      },
      include: {
        staff: true,
        staff_quarter: true,
      },
      orderBy: { allotment_date: "asc" },
    });

    return allocations.map((a) => ({
      quarter_no:     a.staff_quarter?.quarter_number ?? "",
      location:       a.staff_quarter?.location ?? "",
      staff_name:     lang === "bn" ? a.staff?.name_bn : a.staff?.name_en,
      designation:    a.staff?.designation ?? "",
      allotment_date: fmtDate(a.allotment_date),
      vacated_date:   fmtDate(a.vacated_date),
      duration_days:  daysDiff(a.allotment_date, a.vacated_date),
      status:         a.status,
    }));
  }

  // ─── R-06: MP Office & Flat Directory ────────────────────────────────────

  async r06(lang: "en" | "bn", filters: { tenure_id?: number; status?: string; party_id?: number }) {
    const mps = await this.prisma.mp.findMany({
      where: {
        ...(filters.tenure_id && { tenure_id: filters.tenure_id }),
        ...(filters.status    && { status: filters.status as any }),
        ...(filters.party_id  && { party_id: filters.party_id }),
      },
      include: {
        party: true,
        allocations: {
          where: { status: "ACTIVE" },
          include: {
            mp_office: { include: { building: true } },
            mp_flat:   { include: { category: true } },
          },
        },
      },
      orderBy: { parliament_number: "asc" },
    });

    return mps.map((mp) => {
      const officeAlloc = mp.allocations.find((a) => a.allocation_type === "OFFICE");
      const flatAlloc   = mp.allocations.find((a) => a.allocation_type === "MP_FLAT");
      return {
        mp_name:        lang === "bn" ? mp.name_bn : mp.name_en,
        parl_no:        mp.parliament_number,
        party:          lang === "bn" ? (mp.party as any)?.name_bn : (mp.party as any)?.name_en,
        constituency:   mp.constituency ?? "",
        office_building:lang === "bn" ? officeAlloc?.mp_office?.building?.name_bn ?? "" : officeAlloc?.mp_office?.building?.name_en ?? "",
        office_room:    officeAlloc?.mp_office?.room_number ?? "",
        flat_category:  lang === "bn" ? (flatAlloc?.mp_flat?.category as any)?.name_bn : (flatAlloc?.mp_flat?.category as any)?.name_en,
        flat_number:    flatAlloc?.mp_flat?.flat_number ?? "",
        flat_allotment: fmtDate(flatAlloc?.allotment_date),
      };
    });
  }

  // ─── R-07: MP Flat Occupancy ─────────────────────────────────────────────

  async r07(lang: "en" | "bn", filters: { category_id?: number; building_name?: string; status?: string }) {
    const flats = await this.prisma.mpFlat.findMany({
      where: {
        ...(filters.category_id  && { category_id: filters.category_id }),
        ...(filters.building_name && { building_name: { contains: filters.building_name, mode: "insensitive" } }),
        ...(filters.status       && { status: filters.status as any }),
      },
      include: {
        category: true,
        allocations: {
          where: { status: "ACTIVE" },
          include: { mp: true },
          take: 1,
        },
      },
      orderBy: [{ category_id: "asc" }, { flat_number: "asc" }],
    });

    return flats.map((f) => {
      const active = f.allocations[0] ?? null;
      return {
        category:       lang === "bn" ? (f.category as any)?.name_bn : (f.category as any)?.name_en,
        flat_number:    f.flat_number,
        building:       f.building_name ?? "",
        floor:          f.floor ?? "",
        area_sqft:      f.area_sqft ?? "",
        status:         f.status,
        mp_name:        active ? (lang === "bn" ? active.mp?.name_bn : active.mp?.name_en) ?? "" : "",
        allotment_date: fmtDate(active?.allotment_date),
      };
    });
  }

  // ─── R-08: Vacant Assets Summary ─────────────────────────────────────────

  async r08(lang: "en" | "bn", filters: { asset_type?: string; category_id?: number }) {
    const rows: Record<string, unknown>[] = [];

    if (!filters.asset_type || filters.asset_type === "OFFICE") {
      const offices = await this.prisma.mpOffice.findMany({
        where: { status: { in: ["VACANT", "UNDER_MAINTENANCE"] } },
        include: { building: true },
        orderBy: { room_number: "asc" },
      });
      offices.forEach((o) => rows.push({
        asset_type: "MP Office",
        category:   "",
        identifier: o.room_number,
        location:   lang === "bn" ? o.building?.name_bn ?? "" : o.building?.name_en ?? "",
        status:     o.status,
      }));
    }

    if (!filters.asset_type || filters.asset_type === "MP_FLAT") {
      const flats = await this.prisma.mpFlat.findMany({
        where: {
          status: { in: ["VACANT", "UNDER_MAINTENANCE"] },
          ...(filters.category_id && { category_id: filters.category_id }),
        },
        include: { category: true },
        orderBy: { flat_number: "asc" },
      });
      flats.forEach((f) => rows.push({
        asset_type: "MP Flat",
        category:   lang === "bn" ? (f.category as any)?.name_bn : (f.category as any)?.name_en,
        identifier: f.flat_number,
        location:   f.building_name ?? "",
        status:     f.status,
      }));
    }

    if (!filters.asset_type || filters.asset_type === "STAFF_QUARTER") {
      const quarters = await this.prisma.staffQuarter.findMany({
        where: {
          status: { in: ["VACANT", "UNDER_MAINTENANCE"] },
          ...(filters.category_id && { category_id: filters.category_id }),
        },
        include: { category: true },
        orderBy: { quarter_number: "asc" },
      });
      quarters.forEach((q) => rows.push({
        asset_type: "Staff Quarter",
        category:   lang === "bn" ? (q.category as any)?.name_bn : (q.category as any)?.name_en,
        identifier: q.quarter_number,
        location:   q.location,
        status:     q.status,
      }));
    }

    return rows;
  }

  // ─── R-10: Category-wise Summary ─────────────────────────────────────────

  async r10(lang: "en" | "bn", filters: { asset_type?: string }) {
    const rows: Record<string, unknown>[] = [];

    const countByStatus = (items: { status: string }[]) => ({
      total:       items.length,
      occupied:    items.filter((i) => i.status === "OCCUPIED").length,
      vacant:      items.filter((i) => i.status === "VACANT").length,
      maintenance: items.filter((i) => i.status === "UNDER_MAINTENANCE").length,
    });

    if (!filters.asset_type || filters.asset_type === "OFFICE") {
      const buildings = await this.prisma.mpOfficeBuilding.findMany({
        include: { mp_offices: true },
      });
      buildings.forEach((b) => {
        const c = countByStatus(b.mp_offices);
        rows.push({ asset_type: "MP Office", category: lang === "bn" ? b.name_bn : b.name_en, ...c });
      });
    }

    if (!filters.asset_type || filters.asset_type === "MP_FLAT") {
      const cats = await this.prisma.mpFlatCategory.findMany({
        include: { mp_flats: true },
      });
      cats.forEach((c) => {
        const cnt = countByStatus(c.mp_flats);
        rows.push({
          asset_type: "MP Flat",
          category:   lang === "bn" ? (c as any).name_bn : (c as any).name_en,
          ...cnt,
        });
      });
    }

    if (!filters.asset_type || filters.asset_type === "STAFF_QUARTER") {
      const cats = await this.prisma.staffQuarterCategory.findMany({
        include: { staff_quarters: true },
      });
      cats.forEach((c) => {
        const cnt = countByStatus(c.staff_quarters);
        rows.push({
          asset_type: "Staff Quarter",
          category:   lang === "bn" ? (c as any).name_bn : (c as any).name_en,
          ...cnt,
        });
      });
    }

    return rows;
  }

  // ─── R-11: Tenure Changeover Report ──────────────────────────────────────

  async r11(lang: "en" | "bn", filters: { tenure_id?: number }) {
    const mps = await this.prisma.mp.findMany({
      where: {
        ...(filters.tenure_id && { tenure_id: filters.tenure_id }),
      },
      include: {
        party: true,
        allocations: {
          where: { status: "VACATED" },
          orderBy: { vacated_date: "desc" },
          include: { mp_office: true, mp_flat: true },
        },
      },
      orderBy: { parliament_number: "asc" },
    });

    return mps.map((mp) => {
      const vacatedOffice = mp.allocations.find((a) => a.allocation_type === "OFFICE");
      const vacatedFlat   = mp.allocations.find((a) => a.allocation_type === "MP_FLAT");
      return {
        mp_name:        lang === "bn" ? mp.name_bn : mp.name_en,
        parl_no:        mp.parliament_number,
        constituency:   mp.constituency ?? "",
        party:          lang === "bn" ? (mp.party as any)?.name_bn : (mp.party as any)?.name_en,
        office_vacated: fmtDate(vacatedOffice?.vacated_date),
        flat_vacated:   fmtDate(vacatedFlat?.vacated_date),
        mp_status:      mp.status,
      };
    });
  }

  // ─── Column filter helper ─────────────────────────────────────────────────

  filterColumns(allCols: ReportColumn[], selected?: string): ReportColumn[] {
    if (!selected) return allCols;
    const keys = selected.split(",").map((s) => s.trim()).filter(Boolean);
    return allCols.filter((c) => keys.includes(c.key));
  }
}
