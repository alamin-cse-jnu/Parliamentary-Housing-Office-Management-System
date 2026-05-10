import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  findAll(query: { upload_type?: string; page?: number; limit?: number }) {
    const page  = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip  = (page - 1) * limit;

    const where = query.upload_type ? { upload_type: query.upload_type } : {};

    return Promise.all([
      this.prisma.uploadLog.count({ where }),
      this.prisma.uploadLog.findMany({
        where,
        include: {
          uploaded_by_user: {
            select: { id: true, username: true, full_name_en: true },
          },
        },
        orderBy: { uploaded_at: "desc" },
        skip,
        take: limit,
      }),
    ]).then(([total, data]) => ({ total, page, limit, data }));
  }

  async findOne(id: number) {
    const log = await this.prisma.uploadLog.findUnique({
      where: { id },
      include: {
        uploaded_by_user: { select: { id: true, username: true, full_name_en: true } },
        rows: { orderBy: { row_number: "asc" } },
      },
    });
    if (!log) throw new NotFoundException(`Upload log #${id} not found`);
    return log;
  }
}
