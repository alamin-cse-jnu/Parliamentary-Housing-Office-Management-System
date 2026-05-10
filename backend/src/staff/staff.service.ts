import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { parseStaffExcel } from "./staff-upload.parser";
import { CreateStaffDto, UpdateStaffDto, StaffUploadConfirmDto, ChangeDesignationDto } from "./dto/staff.dto";

const STAFF_INCLUDE = {
  department: true,
};

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService, private storage: StorageService) {}

  // ─── LIST / DETAIL ─────────────────────────────────────────────────────────

  findAll(query: {
    status?: string;
    department_id?: number;
    grade?: number;
    employee_class?: string;
    search?: string;
  }) {
    const where: any = {};
    if (query.status)        where.service_status = query.status;
    if (query.department_id) where.department_id = query.department_id;
    if (query.grade)         where.grade = query.grade;
    if (query.employee_class) where.employee_class = query.employee_class;
    if (query.search) {
      where.OR = [
        { name_en: { contains: query.search, mode: "insensitive" } },
        { name_bn: { contains: query.search } },
        { internal_user_id: { contains: query.search } },
        { designation: { contains: query.search, mode: "insensitive" } },
      ];
    }
    return this.prisma.staff.findMany({
      where,
      include: STAFF_INCLUDE,
      orderBy: [{ employee_class: "asc" }, { grade: "asc" }, { name_en: "asc" }],
    });
  }

  async findOne(id: number) {
    const staff = await this.prisma.staff.findUnique({ where: { id }, include: STAFF_INCLUDE });
    if (!staff) throw new NotFoundException(`Staff #${id} not found`);
    return staff;
  }

  async create(dto: CreateStaffDto) {
    const existing = await this.prisma.staff.findUnique({ where: { internal_user_id: dto.internal_user_id } });
    if (existing) throw new BadRequestException(`User ID ${dto.internal_user_id} already exists`);
    return this.prisma.staff.create({
      data: {
        internal_user_id: dto.internal_user_id,
        name_en: dto.name_en,
        name_bn: dto.name_bn ?? dto.name_en,
        mobile: dto.mobile ?? null,
        employee_class: (dto.employee_class ?? "NO_CLASS") as any,
        grade: dto.grade,
        designation: dto.designation,
        department_id: dto.department_id,
        gender: (dto.gender ?? "MALE") as any,
        marital_status: dto.marital_status ? (dto.marital_status as any) : null,
      },
      include: STAFF_INCLUDE,
    });
  }

  async update(id: number, dto: UpdateStaffDto) {
    await this.findOne(id);
    return this.prisma.staff.update({
      where: { id },
      data: {
        ...(dto.name_bn         && { name_bn: dto.name_bn }),
        ...(dto.name_en         && { name_en: dto.name_en }),
        ...(dto.mobile          && { mobile: dto.mobile }),
        ...(dto.employee_class  && { employee_class: dto.employee_class as any }),
        ...(dto.grade           && { grade: dto.grade }),
        ...(dto.designation     && { designation: dto.designation }),
        ...(dto.department_id !== undefined && { department_id: dto.department_id }),
        ...(dto.gender          && { gender: dto.gender as any }),
        ...(dto.marital_status  && { marital_status: dto.marital_status as any }),
        ...(dto.service_status  && { service_status: dto.service_status as any }),
      },
      include: STAFF_INCLUDE,
    });
  }

  // ─── PHOTO ─────────────────────────────────────────────────────────────────

  async uploadPhoto(id: number, file: Express.Multer.File) {
    const staff = await this.findOne(id);
    if (staff.photo_path) await this.storage.deletePhoto(staff.photo_path);
    const photoPath = await this.storage.uploadPhoto(file, "staff");
    return this.prisma.staff.update({ where: { id }, data: { photo_path: photoPath } });
  }

  // ─── DESIGNATION CHANGE ────────────────────────────────────────────────────

  async changeDesignation(id: number, dto: ChangeDesignationDto, changedBy: number) {
    const staff = await this.findOne(id);
    await this.prisma.staffDesignationLog.create({
      data: {
        staff_id: id,
        old_designation: staff.designation,
        new_designation: dto.new_designation,
        effective_date: new Date(dto.effective_date),
        changed_by: changedBy,
      },
    });
    return this.prisma.staff.update({
      where: { id },
      data: { designation: dto.new_designation },
      include: STAFF_INCLUDE,
    });
  }

  getDesignationHistory(id: number) {
    return this.prisma.staffDesignationLog.findMany({
      where: { staff_id: id },
      include: {
        changed_by_user: { select: { username: true, full_name_en: true } },
      },
      orderBy: { effective_date: "desc" },
    });
  }

  // ─── EXCEL UPLOAD ──────────────────────────────────────────────────────────

  previewUpload(file: Express.Multer.File) {
    const result = parseStaffExcel(file.buffer);
    return {
      total: result.valid.length + result.errors.length,
      valid_count: result.valid.length,
      error_count: result.errors.length,
      valid_rows: result.valid,
      error_rows: result.errors,
    };
  }

  async confirmUpload(dto: StaffUploadConfirmDto, uploadedBy: number) {
    const uploadLog = await this.prisma.uploadLog.create({
      data: {
        upload_type: "STAFF",
        original_filename: "confirmed_upload",
        total_rows: dto.rows.length,
        success_rows: 0,
        error_rows: 0,
        uploaded_by: uploadedBy,
      },
    });

    let success = 0;
    let errors = 0;

    for (const [i, row] of dto.rows.entries()) {
      try {
        // Upsert department
        let dept = await this.prisma.department.findFirst({
          where: { OR: [{ name_en: row.department }, { name_bn: row.department }] },
        });
        if (!dept) {
          dept = await this.prisma.department.create({
            data: { name_en: row.department, name_bn: row.department },
          });
        }

        const existing = await this.prisma.staff.findUnique({
          where: { internal_user_id: row.internal_user_id },
        });

        if (existing) {
          // Log designation change if it differs
          if (row.designation && row.designation !== existing.designation) {
            await this.prisma.staffDesignationLog.create({
              data: {
                staff_id: existing.id,
                old_designation: existing.designation,
                new_designation: row.designation,
                effective_date: new Date(),
                changed_by: uploadedBy,
              },
            });
          }
          await this.prisma.staff.update({
            where: { id: existing.id },
            data: {
              ...(row.name_en        && { name_en: row.name_en }),
              ...(row.name_bn        && { name_bn: row.name_bn }),
              ...(row.mobile         && { mobile: row.mobile }),
              ...(row.employee_class && { employee_class: row.employee_class as any }),
              ...(row.grade          && { grade: row.grade }),
              ...(row.designation    && { designation: row.designation }),
              department_id: dept.id,
              ...(row.gender         && { gender: row.gender as any }),
              ...(row.marital_status && { marital_status: row.marital_status as any }),
            },
          });
        } else {
          await this.prisma.staff.create({
            data: {
              internal_user_id: row.internal_user_id,
              name_en: row.name_en ?? row.name_bn ?? "",
              name_bn: row.name_bn ?? row.name_en ?? "",
              mobile: row.mobile,
              employee_class: (row.employee_class as any) ?? "NO_CLASS",
              grade: row.grade ?? 20,
              designation: row.designation,
              department_id: dept.id,
              gender: (row.gender as any) ?? "MALE",
              marital_status: (row.marital_status as any) ?? null,
            },
          });
        }

        await this.prisma.uploadLogRow.create({
          data: { upload_id: uploadLog.id, row_number: i + 1, status: "success" },
        });
        success++;
      } catch (e: any) {
        await this.prisma.uploadLogRow.create({
          data: {
            upload_id: uploadLog.id,
            row_number: i + 1,
            status: "error",
            message: e.message,
            row_data: row as any,
          },
        });
        errors++;
      }
    }

    await this.prisma.uploadLog.update({
      where: { id: uploadLog.id },
      data: { success_rows: success, error_rows: errors },
    });

    return { upload_log_id: uploadLog.id, success, errors };
  }
}
