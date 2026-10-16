import { execFile } from "child_process";
import { mkdir, stat } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { AuditLog } from "../models/AuditLog";
import { BackupRecord } from "../models/BackupRecord";
import { SystemJob } from "../models/SystemJob";

const execFileAsync = promisify(execFile);

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown job error";
}

export async function queueDatabaseBackup(actorId?: string) {
  const job = await SystemJob.create({
    type: "DATABASE_BACKUP",
    status: "QUEUED",
    attempts: 0,
    maxAttempts: 1,
    runAt: new Date(),
    createdBy: actorId,
  });

  const backup = await BackupRecord.create({
    status: "QUEUED",
    jobId: job._id,
    createdBy: actorId,
  });

  job.payload = {
    backupRecordId: backup._id.toString(),
  };

  await job.save();

  return { job, backup };
}

async function executeDatabaseBackup(job: any) {
  const backupRecordId = String(job.payload?.backupRecordId || "");

  if (!backupRecordId) {
    throw new Error("Backup job has no backup record");
  }

  const mongodbUri = process.env.MONGODB_URI?.trim();
  const backupDirectory = process.env.BACKUP_DIR?.trim();
  const mongodumpPath = process.env.MONGODUMP_PATH?.trim() || "mongodump";

  if (!mongodbUri || !backupDirectory) {
    throw new Error("MONGODB_URI and BACKUP_DIR must be configured");
  }

  if (!path.isAbsolute(backupDirectory)) {
    throw new Error("BACKUP_DIR must be an absolute filesystem path");
  }

  const backupRoot = path.resolve(backupDirectory);

  await BackupRecord.findByIdAndUpdate(backupRecordId, {
    $set: {
      status: "RUNNING",
      error: undefined,
    },
  });

  await mkdir(backupRoot, { recursive: true });

  const fileName = `backup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.archive.gz`;

  const archivePath = path.join(backupRoot, fileName);

  if (!archivePath.startsWith(backupRoot)) {
    throw new Error("Invalid backup archive path");
  }

  await execFileAsync(mongodumpPath, [
    `--uri=${mongodbUri}`,
    `--archive=${archivePath}`,
    "--gzip",
  ]);

  const fileInfo = await stat(archivePath);

  await BackupRecord.findByIdAndUpdate(backupRecordId, {
    $set: {
      fileName,
      status: "COMPLETED",
      sizeBytes: fileInfo.size,
      completedAt: new Date(),
      error: undefined,
    },
  });

  await AuditLog.create({
    actorId: job.createdBy,
    action: "DATABASE_BACKUP_COMPLETED",
    entityType: "BackupRecord",
    entityId: backupRecordId,
    metadata: {
      fileName,
      sizeBytes: fileInfo.size,
      jobId: job._id.toString(),
    },
  });
}

export async function processQueuedSystemJobs() {
  const systemJobModel: any = SystemJob;

  while (true) {
    const job = await systemJobModel.findOneAndUpdate(
      {
        type: "DATABASE_BACKUP",
        status: "QUEUED",
        runAt: { $lte: new Date() },
      },
      {
        $set: {
          status: "RUNNING",
          startedAt: new Date(),
          error: undefined,
        },
        $inc: {
          attempts: 1,
        },
      },
      {
       returnDocument: "after",
        sort: { createdAt: 1 },
      }
    );

    if (!job) {
      return;
    }

    try {
      await executeDatabaseBackup(job);

      await SystemJob.findByIdAndUpdate(job._id, {
        $set: {
          status: "COMPLETED",
          completedAt: new Date(),
          error: undefined,
        },
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const backupRecordId = String(job.payload?.backupRecordId || "");

      if (backupRecordId) {
        await BackupRecord.findByIdAndUpdate(backupRecordId, {
          $set: {
            status: "FAILED",
            error: errorMessage,
            completedAt: new Date(),
          },
        });
      }

      await SystemJob.findByIdAndUpdate(job._id, {
        $set: {
          status: "FAILED",
          error: errorMessage,
          completedAt: new Date(),
        },
      });

      await AuditLog.create({
        actorId: job.createdBy,
        action: "DATABASE_BACKUP_FAILED",
        entityType: "SystemJob",
        entityId: job._id.toString(),
        metadata: {
          backupRecordId: backupRecordId || undefined,
          error: errorMessage,
        },
      });
    }
  }
}