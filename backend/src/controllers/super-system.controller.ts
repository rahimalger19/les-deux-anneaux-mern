import { SystemJob } from "../models/SystemJob";
import { queueDatabaseBackup } from "../services/system-job.service";
import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { BackupRecord } from "../models/BackupRecord";
import { FeatureFlag } from "../models/FeatureFlag";
import {
  LEGAL_DOCUMENT_KEYS,
  LegalDocument,
} from "../models/LegalDocument";
import { ensureLegalDocuments } from "./legal.controller";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getSuperSystem(req: Request, res: Response) {
  try {
    await ensureLegalDocuments();

    const [jobs, flags, legalDocuments, auditLogs, backups] = await Promise.all([
      SystemJob.find()
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      FeatureFlag.find().sort({ key: 1 }).lean(),
      LegalDocument.find().sort({ key: 1 }).lean(),
      AuditLog.find()
        .populate("actorId", "name email role")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      BackupRecord.find()
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    return res.json({
      success: true,
      jobs: jobs.map((job: any) => ({
        id: job._id,
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        error: job.error,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdBy: job.createdBy
          ? {
              name: job.createdBy.name,
              email: job.createdBy.email,
            }
          : null,
      })),
      flags: flags.map((flag) => ({ id: flag._id, ...flag })),
      legalDocuments: legalDocuments.map((document) => ({
        id: document._id,
        ...document,
      })),
      auditLogs: auditLogs.map((log: any) => ({
        id: log._id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: log.metadata,
        createdAt: log.createdAt,
        actor: log.actorId
          ? {
              name: log.actorId.name,
              email: log.actorId.email,
              role: log.actorId.role,
            }
          : null,
      })),
      backups: backups.map((backup: any) => ({
        id: backup._id,
        fileName: backup.fileName,
        createdAt: backup.createdAt,
        createdBy: backup.createdBy
          ? {
              name: backup.createdBy.name,
              email: backup.createdBy.email,
            }
          : null,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load system administration",
    });
  }
}

export async function createFeatureFlag(req: Request, res: Response) {
  try {
    const key = String(req.body.key || "").trim();
    const description = String(req.body.description || "").trim();

    if (!/^[a-z0-9-]+$/.test(key) || !description) {
      return res.status(400).json({
        success: false,
        message: "Feature flag key and description are required",
      });
    }

    const flag = await FeatureFlag.create({
      key,
      description,
      enabled: Boolean(req.body.enabled),
      updatedBy: req.user?.id,
    });

    await AuditLog.create({
      actorId: req.user?.id,
      action: "FEATURE_FLAG_CREATED",
      entityType: "FeatureFlag",
      entityId: flag._id.toString(),
      metadata: { key, enabled: flag.enabled },
    });

    return res.status(201).json({ success: true, flag });
  } catch {
    return res.status(400).json({
      success: false,
      message: "Unable to create feature flag",
    });
  }
}

export async function updateFeatureFlag(req: Request, res: Response) {
  try {
    const flagId = getParam(req.params.flagId);

    if (!flagId || typeof req.body.enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Feature flag and enabled value are required",
      });
    }

    const flag = await FeatureFlag.findByIdAndUpdate(
      flagId,
      {
        $set: {
          enabled: req.body.enabled,
          updatedBy: req.user?.id,
        },
      },
      { new: true }
    );

    if (!flag) {
      return res.status(404).json({
        success: false,
        message: "Feature flag not found",
      });
    }

    await AuditLog.create({
      actorId: req.user?.id,
      action: "FEATURE_FLAG_UPDATED",
      entityType: "FeatureFlag",
      entityId: flag._id.toString(),
      metadata: { enabled: flag.enabled },
    });

    return res.json({ success: true, flag });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update feature flag",
    });
  }
}

export async function updateLegalDocument(req: Request, res: Response) {
  try {
    const key = getParam(req.params.key);

    if (
      !key ||
      !LEGAL_DOCUMENT_KEYS.includes(
        key as (typeof LEGAL_DOCUMENT_KEYS)[number]
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid legal document key",
      });
    }

    const { title, content, published } = req.body;

    if (
      !title?.fr ||
      !title?.ar ||
      !title?.en ||
      !content?.fr ||
      !content?.ar ||
      !content?.en ||
      typeof published !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "All three language versions and publication status are required",
      });
    }

    const legalDocumentModel: any = LegalDocument;

    const document = await legalDocumentModel.findOneAndUpdate(
      { key },
      {
        $set: {
          title,
          content,
          published,
          updatedBy: req.user?.id,
        },
        $setOnInsert: {
          key,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Legal document not found",
      });
    }

    await AuditLog.create({
      actorId: req.user?.id,
      action: "LEGAL_DOCUMENT_UPDATED",
      entityType: "LegalDocument",
      entityId: document._id.toString(),
      metadata: { key, published },
    });

    return res.json({ success: true, document });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update legal document",
    });
  }
}

export async function createDatabaseBackup(
  req: Request,
  res: Response
) {
  try {
    if (
      !process.env.MONGODB_URI?.trim() ||
      !process.env.BACKUP_DIR?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "MONGODB_URI and BACKUP_DIR must be configured in backend/.env",
      });
    }

    const { job, backup } = await queueDatabaseBackup(req.user?.id);

    await AuditLog.create({
      actorId: req.user?.id,
      action: "DATABASE_BACKUP_QUEUED",
      entityType: "SystemJob",
      entityId: job._id.toString(),
      metadata: {
        backupRecordId: backup._id.toString(),
      },
    });

    return res.status(202).json({
      success: true,
      message: "Database backup queued",
      job: {
        id: job._id,
        status: job.status,
      },
      backup: {
        id: backup._id,
        status: backup.status,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to queue database backup",
    });
  }
}