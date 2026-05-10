/**
 * Demo data seed — populates the system with realistic sample data for QA.
 * Run: npm run db:seed-demo
 * Safe to re-run (uses upsert / createMany with skipDuplicates).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  // ── 1. MP Office Buildings ──────────────────────────────────────────────────
  const buildings = await Promise.all([
    prisma.mpOfficeBuilding.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name_bn: "সংসদ ভবন (পুরাতন)", name_en: "Parliament Building (Old)", location: "Sher-e-Bangla Nagar" },
    }),
    prisma.mpOfficeBuilding.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name_bn: "সংসদ ভবন (নতুন)", name_en: "Parliament Building (New)", location: "Sher-e-Bangla Nagar" },
    }),
    prisma.mpOfficeBuilding.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, name_bn: "অ্যানেক্স ভবন", name_en: "Annex Building", location: "Sher-e-Bangla Nagar" },
    }),
  ]);
  console.log(`  Buildings: ${buildings.length}`);

  // ── 2. Political Parties ────────────────────────────────────────────────────
  const parties = await Promise.all([
    prisma.politicalParty.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name_bn: "বাংলাদেশ আওয়ামী লীগ", name_en: "Bangladesh Awami League" } }),
    prisma.politicalParty.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name_bn: "বাংলাদেশ জাতীয়তাবাদী দল (বিএনপি)", name_en: "Bangladesh Nationalist Party (BNP)" } }),
    prisma.politicalParty.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name_bn: "জাতীয় পার্টি", name_en: "Jatiya Party" } }),
    prisma.politicalParty.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name_bn: "স্বতন্ত্র", name_en: "Independent" } }),
  ]);
  console.log(`  Parties: ${parties.length}`);

  // ── 3. Departments ──────────────────────────────────────────────────────────
  const depts = await Promise.all([
    prisma.department.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name_bn: "প্রশাসন অধিশাখা", name_en: "Administration Branch" } }),
    prisma.department.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name_bn: "হিসাব অধিশাখা", name_en: "Accounts Branch" } }),
    prisma.department.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name_bn: "গ্রন্থাগার অধিশাখা", name_en: "Library Branch" } }),
    prisma.department.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name_bn: "তথ্য ও যোগাযোগ প্রযুক্তি অধিশাখা", name_en: "ICT Branch" } }),
    prisma.department.upsert({ where: { id: 5 }, update: {}, create: { id: 5, name_bn: "নিরাপত্তা অধিশাখা", name_en: "Security Branch" } }),
  ]);
  console.log(`  Departments: ${depts.length}`);

  // ── 4. MPs (10 sample) ──────────────────────────────────────────────────────
  const mpData = [
    { parliament_number: "001", name_bn: "মোহাম্মদ আব্দুল করিম", name_en: "Mohammad Abdul Karim",      constituency: "ঢাকা-১",          party_id: 1, gender: "MALE",   designation_id: 2, internal_user_id: "MP001" },
    { parliament_number: "002", name_bn: "বেগম ফাতেমা বেগম",     name_en: "Begum Fatema Begum",        constituency: "ঢাকা-২",          party_id: 1, gender: "FEMALE", designation_id: 1, internal_user_id: "MP002" },
    { parliament_number: "003", name_bn: "মো. রফিকুল ইসলাম",     name_en: "Md. Rafiqul Islam",         constituency: "চট্টগ্রাম-১",     party_id: 1, gender: "MALE",   designation_id: 3, internal_user_id: "MP003" },
    { parliament_number: "004", name_bn: "শেখ নুরুল হক",          name_en: "Sheikh Nurul Haque",        constituency: "সিলেট-১",         party_id: 2, gender: "MALE",   designation_id: 1, internal_user_id: "MP004" },
    { parliament_number: "005", name_bn: "ড. নাজমা আক্তার",       name_en: "Dr. Najma Akter",           constituency: "রাজশাহী-১",       party_id: 1, gender: "FEMALE", designation_id: 6, internal_user_id: "MP005" },
    { parliament_number: "006", name_bn: "আলহাজ্ব মতিউর রহমান",   name_en: "Alhaj Matiur Rahman",      constituency: "খুলনা-১",         party_id: 3, gender: "MALE",   designation_id: 1, internal_user_id: "MP006" },
    { parliament_number: "007", name_bn: "মোসাম্মৎ রাশিদা বেগম",  name_en: "Mossammat Rashida Begum",  constituency: "বরিশাল-১",        party_id: 1, gender: "FEMALE", designation_id: 1, internal_user_id: "MP007" },
    { parliament_number: "008", name_bn: "মো. জাহিদ হাসান",       name_en: "Md. Zahid Hasan",          constituency: "ময়মনসিংহ-১",     party_id: 1, gender: "MALE",   designation_id: 4, internal_user_id: "MP008" },
    { parliament_number: "009", name_bn: "ইঞ্জিনিয়ার আমির হোসেন", name_en: "Engr. Amir Hossain",       constituency: "রংপুর-১",         party_id: 2, gender: "MALE",   designation_id: 1, internal_user_id: "MP009" },
    { parliament_number: "010", name_bn: "অ্যাডভোকেট সালমা খানম", name_en: "Advocate Salma Khanam",    constituency: "কুমিল্লা-১",      party_id: 4, gender: "FEMALE", designation_id: 1, internal_user_id: "MP010" },
  ] as const;

  for (const mp of mpData) {
    await prisma.mp.upsert({
      where: { parliament_number: mp.parliament_number },
      update: {},
      create: {
        parliament_number: mp.parliament_number,
        name_bn: mp.name_bn,
        name_en: mp.name_en,
        constituency: mp.constituency,
        party_id: mp.party_id,
        gender: mp.gender as any,
        designation_id: mp.designation_id,
        designation_since: new Date("2026-02-17"),
        status: "ACTIVE",
        tenure_id: 1,
        internal_user_id: mp.internal_user_id,
      },
    });
  }
  console.log(`  MPs: ${mpData.length}`);

  // ── 5. Staff (10 sample) ────────────────────────────────────────────────────
  const staffData = [
    { uid: "ST001", name_bn: "মো. আনোয়ার হোসেন",      name_en: "Md. Anwar Hossain",      mobile: "01711000001", class_: "CLASS_1", grade: 5,  designation: "সিনিয়র সহকারী সচিব",    dept: 1, gender: "MALE",   marital: "MARRIED" },
    { uid: "ST002", name_bn: "মিসেস নার্গিস পারভীন",    name_en: "Mrs. Nargis Parvin",     mobile: "01711000002", class_: "CLASS_1", grade: 6,  designation: "সহকারী সচিব",           dept: 1, gender: "FEMALE", marital: "MARRIED" },
    { uid: "ST003", name_bn: "মো. কামরুল ইসলাম",       name_en: "Md. Kamrul Islam",       mobile: "01711000003", class_: "CLASS_2", grade: 9,  designation: "সিনিয়র অফিস সহকারী",   dept: 2, gender: "MALE",   marital: "MARRIED" },
    { uid: "ST004", name_bn: "মিস সুমাইয়া আক্তার",     name_en: "Miss Sumaiya Akter",     mobile: "01711000004", class_: "CLASS_2", grade: 10, designation: "অফিস সহকারী",           dept: 3, gender: "FEMALE", marital: "SINGLE" },
    { uid: "ST005", name_bn: "মো. রবিউল হক",           name_en: "Md. Rabiul Haque",       mobile: "01711000005", class_: "CLASS_1", grade: 3,  designation: "উপ-সচিব",               dept: 1, gender: "MALE",   marital: "MARRIED" },
    { uid: "ST006", name_bn: "মো. শফিকুল আলম",         name_en: "Md. Shafiqul Alam",     mobile: "01711000006", class_: "CLASS_3", grade: 14, designation: "অফিস সহায়ক",           dept: 4, gender: "MALE",   marital: "MARRIED" },
    { uid: "ST007", name_bn: "বেগম মরিয়ম সুলতানা",     name_en: "Begum Maryam Sultana",  mobile: "01711000007", class_: "CLASS_2", grade: 11, designation: "ডেটা এন্ট্রি অপারেটর", dept: 4, gender: "FEMALE", marital: "MARRIED" },
    { uid: "ST008", name_bn: "মো. আলাউদ্দিন মোল্লা",   name_en: "Md. Alauddin Molla",    mobile: "01711000008", class_: "CLASS_1", grade: 7,  designation: "সহকারী পরিচালক",        dept: 5, gender: "MALE",   marital: "MARRIED" },
    { uid: "ST009", name_bn: "মো. সিরাজুল ইসলাম",      name_en: "Md. Sirajul Islam",     mobile: "01711000009", class_: "CLASS_3", grade: 16, designation: "নিরাপত্তা প্রহরী",      dept: 5, gender: "MALE",   marital: "MARRIED" },
    { uid: "ST010", name_bn: "মোসাম্মৎ হালিমা বেগম",   name_en: "Mossammat Halima Begum", mobile: "01711000010", class_: "CLASS_4", grade: 20, designation: "পরিচ্ছন্নতা কর্মী",    dept: 1, gender: "FEMALE", marital: "WIDOWED" },
  ] as const;

  for (const s of staffData) {
    await prisma.staff.upsert({
      where: { internal_user_id: s.uid },
      update: {},
      create: {
        internal_user_id: s.uid,
        name_bn: s.name_bn,
        name_en: s.name_en,
        mobile: s.mobile,
        employee_class: s.class_ as any,
        grade: s.grade,
        designation: s.designation,
        department_id: s.dept,
        gender: s.gender as any,
        marital_status: s.marital as any,
        service_status: "ACTIVE",
      },
    });
  }
  console.log(`  Staff: ${staffData.length}`);

  // ── 6. MP Offices (12) ──────────────────────────────────────────────────────
  const officeRooms = [
    { building_id: 1, floor: "1st", room_number: "101", phone_intercom: "1101" },
    { building_id: 1, floor: "1st", room_number: "102", phone_intercom: "1102" },
    { building_id: 1, floor: "2nd", room_number: "201", phone_intercom: "1201" },
    { building_id: 1, floor: "2nd", room_number: "202", phone_intercom: "1202" },
    { building_id: 2, floor: "1st", room_number: "101", phone_intercom: "2101" },
    { building_id: 2, floor: "1st", room_number: "102", phone_intercom: "2102" },
    { building_id: 2, floor: "2nd", room_number: "201", phone_intercom: "2201" },
    { building_id: 2, floor: "3rd", room_number: "301", phone_intercom: "2301" },
    { building_id: 3, floor: "1st", room_number: "101", phone_intercom: "3101" },
    { building_id: 3, floor: "1st", room_number: "102", phone_intercom: "3102" },
    { building_id: 3, floor: "2nd", room_number: "201", phone_intercom: "3201" },
    { building_id: 3, floor: "2nd", room_number: "202", phone_intercom: "3202" },
  ];

  const existingOffices = await prisma.mpOffice.count();
  if (existingOffices === 0) {
    await prisma.mpOffice.createMany({ data: officeRooms });
    console.log(`  MP Offices: ${officeRooms.length}`);
  } else {
    console.log(`  MP Offices: skipped (${existingOffices} exist)`);
  }

  // ── 7. MP Flats (12) ───────────────────────────────────────────────────────
  const flatData = [
    { category_id: 1, location_name: "মিন্টো রোড", building_name: "N.A.C. ভবন-১",  flat_number: "A-01", floor: "1st", area_sqft: 2400 },
    { category_id: 1, location_name: "মিন্টো রোড", building_name: "N.A.C. ভবন-১",  flat_number: "A-02", floor: "2nd", area_sqft: 2400 },
    { category_id: 1, location_name: "মিন্টো রোড", building_name: "N.A.C. ভবন-২",  flat_number: "B-01", floor: "1st", area_sqft: 2200 },
    { category_id: 2, location_name: "সংসদ এলাকা",  building_name: "H.C. টাওয়ার",  flat_number: "101",  floor: "1st", area_sqft: 1800 },
    { category_id: 2, location_name: "সংসদ এলাকা",  building_name: "H.C. টাওয়ার",  flat_number: "201",  floor: "2nd", area_sqft: 1800 },
    { category_id: 2, location_name: "সংসদ এলাকা",  building_name: "H.C. টাওয়ার",  flat_number: "301",  floor: "3rd", area_sqft: 1800 },
    { category_id: 3, location_name: "শেরেবাংলা নগর", building_name: "A টাইপ আবাসিক", flat_number: "01", floor: "Ground", area_sqft: 1400 },
    { category_id: 3, location_name: "শেরেবাংলা নগর", building_name: "A টাইপ আবাসিক", flat_number: "02", floor: "1st",   area_sqft: 1400 },
    { category_id: 4, location_name: "শেরেবাংলা নগর", building_name: "B টাইপ আবাসিক", flat_number: "01", floor: "Ground", area_sqft: 1200 },
    { category_id: 4, location_name: "শেরেবাংলা নগর", building_name: "B টাইপ আবাসিক", flat_number: "02", floor: "1st",   area_sqft: 1200 },
    { category_id: 5, location_name: "আগারগাঁও",      building_name: "C টাইপ আবাসিক", flat_number: "01", floor: "Ground", area_sqft: 900 },
    { category_id: 5, location_name: "আগারগাঁও",      building_name: "C টাইপ আবাসিক", flat_number: "02", floor: "1st",   area_sqft: 900 },
  ];

  const existingFlats = await prisma.mpFlat.count();
  if (existingFlats === 0) {
    await prisma.mpFlat.createMany({ data: flatData as any });
    console.log(`  MP Flats: ${flatData.length}`);
  } else {
    console.log(`  MP Flats: skipped (${existingFlats} exist)`);
  }

  // ── 8. Staff Quarters (12) ─────────────────────────────────────────────────
  const quarterData = [
    { category_id: 1, quarter_number: "A-01", location: "শেরেবাংলা নগর", building_name: "A টাইপ কোয়ার্টার", floor: "Ground", house_flat_number: "1",  area_sqft: 1800 },
    { category_id: 1, quarter_number: "A-02", location: "শেরেবাংলা নগর", building_name: "A টাইপ কোয়ার্টার", floor: "1st",   house_flat_number: "2",  area_sqft: 1800 },
    { category_id: 1, quarter_number: "A-03", location: "শেরেবাংলা নগর", building_name: "A টাইপ কোয়ার্টার", floor: "2nd",   house_flat_number: "3",  area_sqft: 1800 },
    { category_id: 2, quarter_number: "B-01", location: "আগারগাঁও",      building_name: "B টাইপ কোয়ার্টার", floor: "Ground", house_flat_number: "1",  area_sqft: 1400 },
    { category_id: 2, quarter_number: "B-02", location: "আগারগাঁও",      building_name: "B টাইপ কোয়ার্টার", floor: "1st",   house_flat_number: "2",  area_sqft: 1400 },
    { category_id: 2, quarter_number: "B-03", location: "আগারগাঁও",      building_name: "B টাইপ কোয়ার্টার", floor: "2nd",   house_flat_number: "3",  area_sqft: 1400 },
    { category_id: 3, quarter_number: "C-01", location: "মিরপুর-১০",     building_name: "C টাইপ কোয়ার্টার", floor: "Ground", house_flat_number: "1",  area_sqft: 1000 },
    { category_id: 3, quarter_number: "C-02", location: "মিরপুর-১০",     building_name: "C টাইপ কোয়ার্টার", floor: "1st",   house_flat_number: "2",  area_sqft: 1000 },
    { category_id: 3, quarter_number: "C-03", location: "মিরপুর-১০",     building_name: "C টাইপ কোয়ার্টার", floor: "2nd",   house_flat_number: "3",  area_sqft: 1000 },
    { category_id: 4, quarter_number: "D-01", location: "মোহাম্মদপুর",   building_name: "D টাইপ কোয়ার্টার", floor: "Ground", house_flat_number: "1",  area_sqft: 750  },
    { category_id: 4, quarter_number: "D-02", location: "মোহাম্মদপুর",   building_name: "D টাইপ কোয়ার্টার", floor: "1st",   house_flat_number: "2",  area_sqft: 750  },
    { category_id: 4, quarter_number: "D-03", location: "মোহাম্মদপুর",   building_name: "D টাইপ কোয়ার্টার", floor: "2nd",   house_flat_number: "3",  area_sqft: 750  },
  ];

  const existingQuarters = await prisma.staffQuarter.count();
  if (existingQuarters === 0) {
    for (const q of quarterData) {
      const cat = await prisma.staffQuarterCategory.findUnique({ where: { id: q.category_id } });
      const catName = cat?.name_en ?? `Cat-${q.category_id}`;
      const full_address = `${catName} - ${q.quarter_number}, ${q.house_flat_number ? `House/Flat No. ${q.house_flat_number}, ` : ""}${q.location}`;
      await prisma.staffQuarter.create({
        data: { ...q, area_sqft: q.area_sqft as any, full_address },
      });
    }
    console.log(`  Staff Quarters: ${quarterData.length}`);
  } else {
    console.log(`  Staff Quarters: skipped (${existingQuarters} exist)`);
  }

  // ── 9. Allocations ─────────────────────────────────────────────────────────
  // Fetch fresh IDs
  const offices  = await prisma.mpOffice.findMany({ orderBy: { id: "asc" } });
  const flats    = await prisma.mpFlat.findMany({ orderBy: { id: "asc" } });
  const quarters = await prisma.staffQuarter.findMany({ orderBy: { id: "asc" } });
  const mps      = await prisma.mp.findMany({ orderBy: { id: "asc" } });
  const staff    = await prisma.staff.findMany({ orderBy: { id: "asc" } });

  const existingAllocations = await prisma.allocation.count();
  if (existingAllocations === 0) {
    // Active office allocations for first 7 MPs
    for (let i = 0; i < Math.min(7, mps.length, offices.length); i++) {
      await prisma.allocation.create({
        data: {
          allocation_type: "OFFICE",
          mp_office_id: offices[i].id,
          occupant_type: "MP",
          mp_id: mps[i].id,
          allotment_date: new Date("2026-02-20"),
          status: "ACTIVE",
          created_by: 1,
        },
      });
      await prisma.mpOffice.update({ where: { id: offices[i].id }, data: { status: "OCCUPIED" } });
    }

    // Active flat allocations for first 6 MPs
    for (let i = 0; i < Math.min(6, mps.length, flats.length); i++) {
      await prisma.allocation.create({
        data: {
          allocation_type: "MP_FLAT",
          mp_flat_id: flats[i].id,
          occupant_type: "MP",
          mp_id: mps[i].id,
          allotment_date: new Date("2026-02-20"),
          status: "ACTIVE",
          created_by: 1,
        },
      });
      await prisma.mpFlat.update({ where: { id: flats[i].id }, data: { status: "OCCUPIED" } });
    }

    // One vacated flat (historical record for MP 7)
    if (flats[6] && mps[6]) {
      await prisma.allocation.create({
        data: {
          allocation_type: "MP_FLAT",
          mp_flat_id: flats[6].id,
          occupant_type: "MP",
          mp_id: mps[6].id,
          allotment_date: new Date("2026-02-20"),
          vacated_date: new Date("2026-04-01"),
          status: "VACATED",
          remarks: "Transferred to new flat",
          created_by: 1,
        },
      });
      // flat[6] remains VACANT
    }

    // Active quarter allocations for first 7 staff members
    for (let i = 0; i < Math.min(7, staff.length, quarters.length); i++) {
      const alloc = await prisma.allocation.create({
        data: {
          allocation_type: "STAFF_QUARTER",
          quarter_id: quarters[i].id,
          occupant_type: "STAFF",
          staff_id: staff[i].id,
          allotment_date: new Date("2026-03-01"),
          status: "ACTIVE",
          created_by: 1,
        },
      });
      await prisma.staffQuarter.update({ where: { id: quarters[i].id }, data: { status: "OCCUPIED" } });

      // Add household members for first 3 staff
      if (i < 3) {
        await prisma.householdMember.create({
          data: {
            staff_id: staff[i].id,
            allocation_id: alloc.id,
            name_bn: `স্ত্রী / স্বামী (${staff[i].name_bn})`,
            name_en: `Spouse of ${staff[i].name_en}`,
            relation_type_id: 1, // Spouse
            date_of_birth: new Date("1985-06-15"),
            identity_number: `NID${90000 + i}`,
            is_active: true,
          },
        });
        if (i < 2) {
          await prisma.householdMember.create({
            data: {
              staff_id: staff[i].id,
              allocation_id: alloc.id,
              name_bn: `সন্তান (${staff[i].name_bn})`,
              name_en: `Child of ${staff[i].name_en}`,
              relation_type_id: 2, // Son
              date_of_birth: new Date("2010-03-20"),
              is_active: true,
            },
          });
        }
      }
    }

    // One vacated quarter (historical)
    if (quarters[7] && staff[7]) {
      await prisma.allocation.create({
        data: {
          allocation_type: "STAFF_QUARTER",
          quarter_id: quarters[7].id,
          occupant_type: "STAFF",
          staff_id: staff[7].id,
          allotment_date: new Date("2025-06-01"),
          vacated_date: new Date("2026-01-31"),
          status: "VACATED",
          remarks: "Staff transferred",
          created_by: 1,
        },
      });
    }

    console.log("  Allocations: offices(7) + flats(6+1 vacated) + quarters(7+1 vacated)");
    console.log("  Household members: 5 (spouse + child for first 3 staff)");
  } else {
    console.log(`  Allocations: skipped (${existingAllocations} exist)`);
  }

  console.log("\nDemo seed complete.");
  console.log("Summary:");
  console.log(`  system_users  : ${await prisma.systemUser.count()}`);
  console.log(`  mps           : ${await prisma.mp.count()}`);
  console.log(`  staff         : ${await prisma.staff.count()}`);
  console.log(`  mp_offices    : ${await prisma.mpOffice.count()}`);
  console.log(`  mp_flats      : ${await prisma.mpFlat.count()}`);
  console.log(`  staff_quarters: ${await prisma.staffQuarter.count()}`);
  console.log(`  allocations   : ${await prisma.allocation.count()}`);
  console.log(`  household_mbrs: ${await prisma.householdMember.count()}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
