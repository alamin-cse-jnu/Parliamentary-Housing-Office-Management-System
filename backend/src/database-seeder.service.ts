import { Injectable, OnApplicationBootstrap, Logger } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class DatabaseSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    const existing = await this.prisma.systemUser.findUnique({
      where: { username: "superadmin" },
    });
    if (existing) return; // already seeded — fast path on every subsequent boot

    this.logger.log("Fresh database detected — seeding default data...");

    // Users
    const superHash = await bcrypt.hash("Admin@1234", 10);
    await this.prisma.systemUser.create({
      data: {
        username: "superadmin",
        password: superHash,
        full_name_en: "Super Administrator",
        full_name_bn: "সুপার অ্যাডমিন",
        role: "SUPER_ADMIN",
      },
    });

    const adminHash = await bcrypt.hash("Admin@1234", 10);
    await this.prisma.systemUser.create({
      data: {
        username: "admin",
        password: adminHash,
        full_name_en: "Administrator",
        full_name_bn: "অ্যাডমিন",
        role: "ADMIN",
      },
    });

    // 13th Parliament Tenure
    await this.prisma.parliamentTenure.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: "13th Parliament",
        start_date: new Date("2026-02-17"),
        is_active: true,
        created_by: 1,
      },
    });
    await this.prisma.$executeRaw`SELECT setval('parliament_tenures_id_seq', (SELECT MAX(id) FROM parliament_tenures))`;

    // MP Designations
    const mpDesignations = [
      { id: 1,  name_bn: "সংসদ সদস্য",        name_en: "Member of Parliament", sort_order: 1 },
      { id: 2,  name_bn: "প্রধানমন্ত্রী",         name_en: "Prime Minister",       sort_order: 2 },
      { id: 3,  name_bn: "মন্ত্রী",              name_en: "Minister",             sort_order: 3 },
      { id: 4,  name_bn: "প্রতিমন্ত্রী",          name_en: "State Minister",       sort_order: 4 },
      { id: 5,  name_bn: "উপমন্ত্রী",            name_en: "Deputy Minister",      sort_order: 5 },
      { id: 6,  name_bn: "স্পিকার",             name_en: "Speaker",              sort_order: 6 },
      { id: 7,  name_bn: "ডেপুটি স্পিকার",       name_en: "Deputy Speaker",       sort_order: 7 },
      { id: 8,  name_bn: "চিফ হুইপ",            name_en: "Chief Whip",           sort_order: 8 },
      { id: 9,  name_bn: "হুইপ",                name_en: "Whip",                 sort_order: 9 },
      { id: 10, name_bn: "বিরোধী দলীয় নেতা",    name_en: "Opposition Leader",    sort_order: 10 },
    ];
    for (const d of mpDesignations) {
      await this.prisma.mpDesignation.upsert({ where: { id: d.id }, update: {}, create: d });
    }
    await this.prisma.$executeRaw`SELECT setval('mp_designations_id_seq', (SELECT MAX(id) FROM mp_designations))`;

    // Household Relation Types
    const relations = [
      { id: 1, name_bn: "স্বামী/স্ত্রী", name_en: "Spouse",    sort_order: 1 },
      { id: 2, name_bn: "পুত্র",          name_en: "Son",       sort_order: 2 },
      { id: 3, name_bn: "কন্যা",          name_en: "Daughter",  sort_order: 3 },
      { id: 4, name_bn: "পিতা",           name_en: "Father",    sort_order: 4 },
      { id: 5, name_bn: "মাতা",           name_en: "Mother",    sort_order: 5 },
      { id: 6, name_bn: "ভাই",            name_en: "Brother",   sort_order: 6 },
      { id: 7, name_bn: "বোন",            name_en: "Sister",    sort_order: 7 },
      { id: 8, name_bn: "অন্যান্য",        name_en: "Other",     sort_order: 8 },
    ];
    for (const r of relations) {
      await this.prisma.householdRelationType.upsert({ where: { id: r.id }, update: {}, create: r });
    }
    await this.prisma.$executeRaw`SELECT setval('household_relation_types_id_seq', (SELECT MAX(id) FROM household_relation_types))`;

    // MP Flat Categories
    const flatCategories = [
      { id: 1, name_bn: "এন.এ.সি.", name_en: "N.A.C.", sort_order: 1 },
      { id: 2, name_bn: "এইচ.সি.",  name_en: "H.C.",   sort_order: 2 },
      { id: 3, name_bn: "এ",         name_en: "A",      sort_order: 3 },
      { id: 4, name_bn: "বি",         name_en: "B",      sort_order: 4 },
      { id: 5, name_bn: "সি",         name_en: "C",      sort_order: 5 },
    ];
    for (const c of flatCategories) {
      await this.prisma.mpFlatCategory.upsert({ where: { id: c.id }, update: {}, create: c });
    }
    await this.prisma.$executeRaw`SELECT setval('mp_flat_categories_id_seq', (SELECT MAX(id) FROM mp_flat_categories))`;

    // Staff Quarter Categories
    const quarterCategories = [
      { id: 1, name_bn: "এ টাইপ", name_en: "Type A", sort_order: 1 },
      { id: 2, name_bn: "বি টাইপ", name_en: "Type B", sort_order: 2 },
      { id: 3, name_bn: "সি টাইপ", name_en: "Type C", sort_order: 3 },
      { id: 4, name_bn: "ডি টাইপ", name_en: "Type D", sort_order: 4 },
    ];
    for (const c of quarterCategories) {
      await this.prisma.staffQuarterCategory.upsert({ where: { id: c.id }, update: {}, create: c });
    }
    await this.prisma.$executeRaw`SELECT setval('staff_quarter_categories_id_seq', (SELECT MAX(id) FROM staff_quarter_categories))`;

    this.logger.log("Seed complete — login: superadmin / Admin@1234");
  }
}
