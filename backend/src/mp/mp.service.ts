import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { parseMpExcel } from "./mp-upload.parser";
import { CreateMpDto, UpdateMpDto, MpUploadConfirmDto, AssignDesignationDto } from "./dto/mp.dto";

const MP_INCLUDE = {
  party: true,
  designation: true,
  tenure: { select: { id: true, name: true } },
};

@Injectable()
export class MpService {
  constructor(private prisma: PrismaService, private storage: StorageService) {}

  // ─── LIST / DETAIL ─────────────────────────────────────────────────────────

  findAll(query: { tenure_id?: number; status?: string; party_id?: number; search?: string }) {
    const where: any = {};
    if (query.tenure_id) where.tenure_id = query.tenure_id;
    if (query.status)    where.status = query.status;
    if (query.party_id)  where.party_id = query.party_id;
    if (query.search) {
      where.OR = [
        { name_en: { contains: query.search, mode: "insensitive" } },
        { name_bn: { contains: query.search } },
        { parliament_number: { contains: query.search } },
        { constituency: { contains: query.search, mode: "insensitive" } },
      ];
    }
    return this.prisma.mp.findMany({
      where,
      include: MP_INCLUDE,
      orderBy: { parliament_number: "asc" },
    });
  }

  async findOne(id: number) {
    const mp = await this.prisma.mp.findUnique({ where: { id }, include: MP_INCLUDE });
    if (!mp) throw new NotFoundException(`MP #${id} not found`);
    return mp;
  }

  async create(dto: CreateMpDto) {
    const existing = await this.prisma.mp.findUnique({ where: { parliament_number: dto.parliament_number } });
    if (existing) throw new BadRequestException(`Parliament number ${dto.parliament_number} already exists`);
    return this.prisma.mp.create({
      data: {
        parliament_number: dto.parliament_number,
        internal_user_id: dto.internal_user_id,
        name_en: dto.name_en,
        name_bn: dto.name_bn ?? dto.name_en,
        constituency: dto.constituency,
        party_id: dto.party_id,
        tenure_id: dto.tenure_id,
        gender: (dto.gender ?? "MALE") as any,
        status: (dto.status ?? "ACTIVE") as any,
      },
      include: MP_INCLUDE,
    });
  }

  async update(id: number, dto: UpdateMpDto) {
    await this.findOne(id);
    return this.prisma.mp.update({
      where: { id },
      data: {
        ...(dto.name_bn && { name_bn: dto.name_bn }),
        ...(dto.name_en && { name_en: dto.name_en }),
        ...(dto.constituency && { constituency: dto.constituency }),
        ...(dto.party_id !== undefined && { party_id: dto.party_id }),
        ...(dto.gender && { gender: dto.gender as any }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.designation_id !== undefined && { designation_id: dto.designation_id }),
        ...(dto.designation_since && { designation_since: new Date(dto.designation_since) }),
      },
      include: MP_INCLUDE,
    });
  }

  // ─── PHOTO UPLOAD ──────────────────────────────────────────────────────────

  async uploadPhoto(id: number, file: Express.Multer.File) {
    const mp = await this.findOne(id);
    if (mp.photo_path) await this.storage.deletePhoto(mp.photo_path);
    const path = await this.storage.uploadPhoto(file, "mp");
    return this.prisma.mp.update({ where: { id }, data: { photo_path: path } });
  }

  // ─── DESIGNATION ───────────────────────────────────────────────────────────

  async assignDesignation(id: number, dto: AssignDesignationDto, changedBy: number) {
    const mp = await this.findOne(id);
    await this.prisma.mpDesignationLog.create({
      data: {
        mp_id: id,
        old_designation_id: mp.designation_id,
        new_designation_id: dto.designation_id,
        effective_date: new Date(dto.effective_date),
        changed_by: changedBy,
      },
    });
    return this.prisma.mp.update({
      where: { id },
      data: {
        designation_id: dto.designation_id,
        designation_since: new Date(dto.effective_date),
      },
      include: MP_INCLUDE,
    });
  }

  getDesignationHistory(id: number) {
    return this.prisma.mpDesignationLog.findMany({
      where: { mp_id: id },
      include: {
        old_designation: true,
        new_designation: true,
        changed_by_user: { select: { username: true, full_name_en: true } },
      },
      orderBy: { effective_date: "desc" },
    });
  }

  // ─── EXCEL UPLOAD ──────────────────────────────────────────────────────────

  previewUpload(file: Express.Multer.File) {
    const result = parseMpExcel(file.buffer);
    return {
      total: result.valid.length + result.errors.length,
      valid_count: result.valid.length,
      error_count: result.errors.length,
      valid_rows: result.valid,
      error_rows: result.errors,
    };
  }

  async confirmUpload(dto: MpUploadConfirmDto, uploadedBy: number) {
    const tenure = await this.prisma.parliamentTenure.findUnique({ where: { id: dto.tenure_id } });
    if (!tenure) throw new BadRequestException(`Tenure #${dto.tenure_id} not found`);

    const uploadLog = await this.prisma.uploadLog.create({
      data: {
        upload_type: "MP",
        original_filename: "confirmed_upload",
        total_rows: dto.rows.length,
        success_rows: 0,
        error_rows: 0,
        uploaded_by: uploadedBy,
      },
    });

    let success = 0;
    let errors = 0;

    for (const row of dto.rows) {
      try {
        // Upsert party
        let party = await this.prisma.politicalParty.findFirst({
          where: { OR: [{ name_en: row.party }, { name_bn: row.party }] },
        });
        if (!party) {
          party = await this.prisma.politicalParty.create({
            data: { name_en: row.party, name_bn: row.party },
          });
        }

        await this.prisma.mp.upsert({
          where: { parliament_number: row.parliament_number },
          update: {
            ...(row.name_en && { name_en: row.name_en }),
            ...(row.name_bn && { name_bn: row.name_bn }),
            constituency: row.constituency,
            party_id: party.id,
            status: (row.status as any) ?? "ACTIVE",
            gender: (row.gender as any) ?? "MALE",
            internal_user_id: row.internal_user_id,
          },
          create: {
            parliament_number: row.parliament_number,
            internal_user_id: row.internal_user_id,
            name_en: row.name_en ?? row.name_bn ?? "",
            name_bn: row.name_bn ?? row.name_en ?? "",
            constituency: row.constituency,
            party_id: party.id,
            status: (row.status as any) ?? "ACTIVE",
            gender: (row.gender as any) ?? "MALE",
            tenure_id: dto.tenure_id,
          },
        });

        await this.prisma.uploadLogRow.create({
          data: { upload_id: uploadLog.id, row_number: dto.rows.indexOf(row) + 1, status: "success" },
        });
        success++;
      } catch (e: any) {
        await this.prisma.uploadLogRow.create({
          data: {
            upload_id: uploadLog.id,
            row_number: dto.rows.indexOf(row) + 1,
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
