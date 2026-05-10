-- CreateTable
CREATE TABLE "staff_designation_types" (
    "id" SERIAL NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_bn" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "staff_designation_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_designation_types_name_en_key" ON "staff_designation_types"("name_en");
