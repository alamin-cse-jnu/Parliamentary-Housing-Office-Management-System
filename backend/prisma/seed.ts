import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // SuperAdmin account
  const hashed = await bcrypt.hash("Admin@1234", 10);
  await prisma.systemUser.upsert({
    where: { username: "superadmin" },
    update: {},
    create: {
      username: "superadmin",
      password: hashed,
      full_name_en: "Super Administrator",
      full_name_bn: "সুপার অ্যাডমিন",
      role: "SUPER_ADMIN",
    },
  });

  // Default Admin account
  const adminHashed = await bcrypt.hash("Admin@1234", 10);
  await prisma.systemUser.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminHashed,
      full_name_en: "Administrator",
      full_name_bn: "অ্যাডমিন",
      role: "ADMIN",
    },
  });

  // 13th Parliament Tenure
  await prisma.parliamentTenure.upsert({
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

  // MP Designations
  const mpDesignations = [
    { name_bn: "সংসদ সদস্য", name_en: "Member of Parliament", sort_order: 1 },
    { name_bn: "প্রধানমন্ত্রী", name_en: "Prime Minister", sort_order: 2 },
    { name_bn: "মন্ত্রী", name_en: "Minister", sort_order: 3 },
    { name_bn: "প্রতিমন্ত্রী", name_en: "State Minister", sort_order: 4 },
    { name_bn: "উপমন্ত্রী", name_en: "Deputy Minister", sort_order: 5 },
    { name_bn: "স্পিকার", name_en: "Speaker", sort_order: 6 },
    { name_bn: "ডেপুটি স্পিকার", name_en: "Deputy Speaker", sort_order: 7 },
    { name_bn: "চিফ হুইপ", name_en: "Chief Whip", sort_order: 8 },
    { name_bn: "হুইপ", name_en: "Whip", sort_order: 9 },
    { name_bn: "বিরোধী দলীয় নেতা", name_en: "Opposition Leader", sort_order: 10 },
  ];
  for (const d of mpDesignations) {
    await prisma.mpDesignation.upsert({
      where: { id: mpDesignations.indexOf(d) + 1 },
      update: {},
      create: { ...d, id: mpDesignations.indexOf(d) + 1 },
    });
  }

  // Household Relation Types
  const relations = [
    { name_bn: "স্বামী/স্ত্রী", name_en: "Spouse", sort_order: 1 },
    { name_bn: "পুত্র", name_en: "Son", sort_order: 2 },
    { name_bn: "কন্যা", name_en: "Daughter", sort_order: 3 },
    { name_bn: "পিতা", name_en: "Father", sort_order: 4 },
    { name_bn: "মাতা", name_en: "Mother", sort_order: 5 },
    { name_bn: "ভাই", name_en: "Brother", sort_order: 6 },
    { name_bn: "বোন", name_en: "Sister", sort_order: 7 },
    { name_bn: "অন্যান্য", name_en: "Other", sort_order: 8 },
  ];
  for (const r of relations) {
    await prisma.householdRelationType.upsert({
      where: { id: relations.indexOf(r) + 1 },
      update: {},
      create: { ...r, id: relations.indexOf(r) + 1 },
    });
  }

  // MP Flat Categories
  const flatCategories = [
    { name_bn: "এন.এ.সি.", name_en: "N.A.C.", sort_order: 1 },
    { name_bn: "এইচ.সি.", name_en: "H.C.", sort_order: 2 },
    { name_bn: "এ", name_en: "A", sort_order: 3 },
    { name_bn: "বি", name_en: "B", sort_order: 4 },
    { name_bn: "সি", name_en: "C", sort_order: 5 },
  ];
  for (const c of flatCategories) {
    await prisma.mpFlatCategory.upsert({
      where: { id: flatCategories.indexOf(c) + 1 },
      update: {},
      create: { ...c, id: flatCategories.indexOf(c) + 1 },
    });
  }

  // Staff Quarter Categories (examples — admin can add more)
  const quarterCategories = [
    { name_bn: "এ টাইপ", name_en: "Type A", sort_order: 1 },
    { name_bn: "বি টাইপ", name_en: "Type B", sort_order: 2 },
    { name_bn: "সি টাইপ", name_en: "Type C", sort_order: 3 },
    { name_bn: "ডি টাইপ", name_en: "Type D", sort_order: 4 },
  ];
  for (const c of quarterCategories) {
    await prisma.staffQuarterCategory.upsert({
      where: { id: quarterCategories.indexOf(c) + 1 },
      update: {},
      create: { ...c, id: quarterCategories.indexOf(c) + 1 },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
