/**
 * Clear all MP and Staff records (and their dependent data).
 * Assets (offices, flats, quarters) are kept — their status is reset to VACANT.
 * Lookup tables (parties, departments, categories, etc.) are kept.
 *
 * Run: npm run db:clear-people
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing all MPs and Staff...\n");

  // 1. Household members (FK → staff, allocation)
  const hm = await prisma.householdMember.deleteMany({});
  console.log(`  Deleted household_members : ${hm.count}`);

  // 2. Allocations (FK → mp, staff, offices, flats, quarters)
  const al = await prisma.allocation.deleteMany({});
  console.log(`  Deleted allocations       : ${al.count}`);

  // 3. Reset all asset statuses back to VACANT
  const [offices, flats, quarters] = await Promise.all([
    prisma.mpOffice.updateMany({ data: { status: "VACANT" } }),
    prisma.mpFlat.updateMany({ data: { status: "VACANT" } }),
    prisma.staffQuarter.updateMany({ data: { status: "VACANT" } }),
  ]);
  console.log(`  Reset VACANT — offices: ${offices.count}, flats: ${flats.count}, quarters: ${quarters.count}`);

  // 4. MP designation logs (FK → mp)
  const mdl = await prisma.mpDesignationLog.deleteMany({});
  console.log(`  Deleted mp_designation_logs   : ${mdl.count}`);

  // 5. Staff designation logs (FK → staff)
  const sdl = await prisma.staffDesignationLog.deleteMany({});
  console.log(`  Deleted staff_designation_logs: ${sdl.count}`);

  // 6. MPs
  const mps = await prisma.mp.deleteMany({});
  console.log(`  Deleted mps               : ${mps.count}`);

  // 7. Staff
  const staff = await prisma.staff.deleteMany({});
  console.log(`  Deleted staff             : ${staff.count}`);

  console.log("\nDone. System is ready for real Excel uploads.");
  console.log("Assets, categories, parties, departments, buildings are untouched.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
