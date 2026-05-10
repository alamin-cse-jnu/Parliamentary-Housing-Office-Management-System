import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;

  constructor(private config: ConfigService) {
    this.backupDir = config.get("BACKUP_DIR", "/var/backups/parliament");
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  async trigger(): Promise<{ filename: string; size_bytes: number; created_at: string }> {
    const dbUrl   = this.config.get<string>("DATABASE_URL");
    if (!dbUrl) throw new ServiceUnavailableException("DATABASE_URL not set");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename  = `parliament_backup_${timestamp}.sql.gz`;
    const filepath  = path.join(this.backupDir, filename);

    // pg_dump → gzip — requires pg_dump available in PATH (standard in postgres Docker image)
    const cmd = `pg_dump "${dbUrl}" | gzip > "${filepath}"`;

    try {
      await execAsync(cmd, { timeout: 120_000 });
    } catch (err: any) {
      this.logger.error("Backup failed", err.message);
      throw new ServiceUnavailableException(
        `Backup failed: ${err.message ?? "pg_dump error"}`,
      );
    }

    const { size: size_bytes } = fs.statSync(filepath);
    this.logger.log(`Backup created: ${filename} (${size_bytes} bytes)`);

    return { filename, size_bytes, created_at: new Date().toISOString() };
  }

  listBackups(): { filename: string; size_bytes: number; created_at: string }[] {
    try {
      return fs
        .readdirSync(this.backupDir)
        .filter((f) => f.endsWith(".sql.gz"))
        .map((filename) => {
          const stat = fs.statSync(path.join(this.backupDir, filename));
          return { filename, size_bytes: stat.size, created_at: stat.mtime.toISOString() };
        })
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    } catch {
      return [];
    }
  }
}
