import { Injectable, OnModuleInit, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";
import { v4 as uuid } from "uuid";
import * as path from "path";

const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png"];
const MAX_BYTES = 500 * 1024; // 500 KB

@Injectable()
export class StorageService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.bucket = config.get("MINIO_BUCKET", "parliament-photos");
    this.client = new Minio.Client({
      endPoint: config.get("MINIO_ENDPOINT", "localhost"),
      port: parseInt(config.get("MINIO_PORT", "9000")),
      useSSL: config.get("MINIO_USE_SSL") === "true",
      accessKey: config.get("MINIO_ACCESS_KEY", "minioadmin"),
      secretKey: config.get("MINIO_SECRET_KEY", "minioadmin123"),
    });
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, "us-east-1");
    }
    // Allow anonymous GET so Nginx can proxy photos without per-request auth
    const policy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${this.bucket}/*`],
      }],
    });
    await this.client.setBucketPolicy(this.bucket, policy);
  }

  async uploadPhoto(
    file: Express.Multer.File,
    folder: "mp" | "staff" | "household",
  ): Promise<string> {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException("Only JPG and PNG files are allowed");
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException("Photo must be 500KB or smaller");
    }

    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const objectName = `${folder}/${uuid()}${ext}`;

    await this.client.putObject(
      this.bucket,
      objectName,
      file.buffer,
      file.size,
      { "Content-Type": file.mimetype },
    );

    return objectName;
  }

  async deletePhoto(objectName: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, objectName);
    } catch {
      // Ignore — object may already be deleted
    }
  }

  getPhotoUrl(objectName: string): string {
    const endpoint = this.config.get("MINIO_ENDPOINT", "localhost");
    const port = this.config.get("MINIO_PORT", "9000");
    const ssl = this.config.get("MINIO_USE_SSL") === "true";
    const proto = ssl ? "https" : "http";
    return `${proto}://${endpoint}:${port}/${this.bucket}/${objectName}`;
  }
}
