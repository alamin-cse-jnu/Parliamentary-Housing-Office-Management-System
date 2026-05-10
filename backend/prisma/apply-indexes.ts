import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS uidx_active_office_alloc
      ON allocations (mp_office_id)
      WHERE status = 'ACTIVE' AND mp_office_id IS NOT NULL
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS uidx_active_flat_alloc
      ON allocations (mp_flat_id)
      WHERE status = 'ACTIVE' AND mp_flat_id IS NOT NULL
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS uidx_active_quarter_alloc
      ON allocations (quarter_id)
      WHERE status = 'ACTIVE' AND quarter_id IS NOT NULL
  `);
  console.log("Partial unique indexes applied.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
