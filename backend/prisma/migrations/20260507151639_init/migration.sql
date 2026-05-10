-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "EmployeeClass" AS ENUM ('CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'NO_CLASS');

-- CreateEnum
CREATE TYPE "MpStatus" AS ENUM ('ACTIVE', 'RESIGNED', 'DECEASED', 'SEAT_VACANT');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'RETIRED', 'TRANSFERRED', 'DECEASED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('VACANT', 'OCCUPIED', 'UNDER_MAINTENANCE');

-- CreateEnum
CREATE TYPE "AllocationType" AS ENUM ('OFFICE', 'MP_FLAT', 'STAFF_QUARTER');

-- CreateEnum
CREATE TYPE "OccupantType" AS ENUM ('MP', 'STAFF');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('ACTIVE', 'VACATED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "system_users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name_bn" TEXT,
    "full_name_en" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "changed_by" INTEGER NOT NULL,
    "ip_address" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mp_flat_categories" (
    "id" SERIAL NOT NULL,
    "name_bn" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "mp_flat_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_quarter_categories" (
    "id" SERIAL NOT NULL,
    "name_bn" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "staff_quarter_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "political_parties" (
    "id" SERIAL NOT NULL,
    "name_bn" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,

    CONSTRAINT "political_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name_bn" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mp_designations" (
    "id" SERIAL NOT NULL,
    "name_bn" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "mp_designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mp_office_buildings" (
    "id" SERIAL NOT NULL,
    "name_bn" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "location" TEXT,

    CONSTRAINT "mp_office_buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_relation_types" (
    "id" SERIAL NOT NULL,
    "name_bn" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "household_relation_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parliament_tenures" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parliament_tenures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mps" (
    "id" SERIAL NOT NULL,
    "parliament_number" TEXT NOT NULL,
    "name_bn" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "constituency" TEXT NOT NULL,
    "party_id" INTEGER,
    "gender" "Gender" NOT NULL,
    "photo_path" TEXT,
    "internal_user_id" TEXT NOT NULL,
    "designation_id" INTEGER,
    "designation_since" DATE,
    "status" "MpStatus" NOT NULL DEFAULT 'ACTIVE',
    "tenure_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mp_designation_logs" (
    "id" SERIAL NOT NULL,
    "mp_id" INTEGER NOT NULL,
    "old_designation_id" INTEGER,
    "new_designation_id" INTEGER,
    "effective_date" DATE NOT NULL,
    "changed_by" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mp_designation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" SERIAL NOT NULL,
    "internal_user_id" TEXT NOT NULL,
    "name_bn" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "mobile" TEXT,
    "employee_class" "EmployeeClass" NOT NULL,
    "grade" INTEGER NOT NULL,
    "designation" TEXT NOT NULL,
    "department_id" INTEGER,
    "gender" "Gender" NOT NULL,
    "marital_status" "MaritalStatus",
    "photo_path" TEXT,
    "service_status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_designation_logs" (
    "id" SERIAL NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "old_designation" TEXT,
    "new_designation" TEXT NOT NULL,
    "effective_date" DATE NOT NULL,
    "changed_by" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_designation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mp_offices" (
    "id" SERIAL NOT NULL,
    "building_id" INTEGER NOT NULL,
    "floor" TEXT,
    "room_number" TEXT NOT NULL,
    "phone_intercom" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'VACANT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mp_offices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mp_flats" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "location_name" TEXT NOT NULL,
    "building_name" TEXT NOT NULL,
    "flat_number" TEXT NOT NULL,
    "floor" TEXT,
    "area_sqft" DECIMAL(10,2),
    "status" "AssetStatus" NOT NULL DEFAULT 'VACANT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mp_flats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_quarters" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "quarter_number" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "building_name" TEXT,
    "floor" TEXT,
    "house_flat_number" TEXT,
    "area_sqft" DECIMAL(10,2),
    "full_address" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'VACANT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_quarters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" SERIAL NOT NULL,
    "allocation_type" "AllocationType" NOT NULL,
    "mp_office_id" INTEGER,
    "mp_flat_id" INTEGER,
    "quarter_id" INTEGER,
    "occupant_type" "OccupantType" NOT NULL,
    "mp_id" INTEGER,
    "staff_id" INTEGER,
    "allotment_date" DATE NOT NULL,
    "vacated_date" DATE,
    "remarks" TEXT,
    "status" "AllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_members" (
    "id" SERIAL NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "allocation_id" INTEGER NOT NULL,
    "name_bn" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "relation_type_id" INTEGER NOT NULL,
    "date_of_birth" DATE,
    "identity_number" TEXT,
    "photo_path" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_logs" (
    "id" SERIAL NOT NULL,
    "upload_type" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "success_rows" INTEGER NOT NULL,
    "error_rows" INTEGER NOT NULL,
    "uploaded_by" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_log_rows" (
    "id" SERIAL NOT NULL,
    "upload_id" INTEGER NOT NULL,
    "row_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "row_data" JSONB,

    CONSTRAINT "upload_log_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_users_username_key" ON "system_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "mps_parliament_number_key" ON "mps"("parliament_number");

-- CreateIndex
CREATE UNIQUE INDEX "mps_internal_user_id_key" ON "mps"("internal_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_internal_user_id_key" ON "staff"("internal_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mp_flats_building_name_flat_number_key" ON "mp_flats"("building_name", "flat_number");

-- CreateIndex
CREATE UNIQUE INDEX "staff_quarters_category_id_quarter_number_key" ON "staff_quarters"("category_id", "quarter_number");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "system_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parliament_tenures" ADD CONSTRAINT "parliament_tenures_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "system_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mps" ADD CONSTRAINT "mps_tenure_id_fkey" FOREIGN KEY ("tenure_id") REFERENCES "parliament_tenures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mps" ADD CONSTRAINT "mps_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "political_parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mps" ADD CONSTRAINT "mps_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "mp_designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mp_designation_logs" ADD CONSTRAINT "mp_designation_logs_mp_id_fkey" FOREIGN KEY ("mp_id") REFERENCES "mps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mp_designation_logs" ADD CONSTRAINT "mp_designation_logs_old_designation_id_fkey" FOREIGN KEY ("old_designation_id") REFERENCES "mp_designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mp_designation_logs" ADD CONSTRAINT "mp_designation_logs_new_designation_id_fkey" FOREIGN KEY ("new_designation_id") REFERENCES "mp_designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mp_designation_logs" ADD CONSTRAINT "mp_designation_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "system_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_designation_logs" ADD CONSTRAINT "staff_designation_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_designation_logs" ADD CONSTRAINT "staff_designation_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "system_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mp_offices" ADD CONSTRAINT "mp_offices_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "mp_office_buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mp_flats" ADD CONSTRAINT "mp_flats_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "mp_flat_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_quarters" ADD CONSTRAINT "staff_quarters_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "staff_quarter_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_mp_office_id_fkey" FOREIGN KEY ("mp_office_id") REFERENCES "mp_offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_mp_flat_id_fkey" FOREIGN KEY ("mp_flat_id") REFERENCES "mp_flats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_quarter_id_fkey" FOREIGN KEY ("quarter_id") REFERENCES "staff_quarters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_mp_id_fkey" FOREIGN KEY ("mp_id") REFERENCES "mps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "system_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_allocation_id_fkey" FOREIGN KEY ("allocation_id") REFERENCES "allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_relation_type_id_fkey" FOREIGN KEY ("relation_type_id") REFERENCES "household_relation_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_logs" ADD CONSTRAINT "upload_logs_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "system_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_log_rows" ADD CONSTRAINT "upload_log_rows_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "upload_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
