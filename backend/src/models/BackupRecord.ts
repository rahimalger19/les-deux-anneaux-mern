import mongoose, { Schema, type Document } from "mongoose";

export type BackupStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export interface IBackupRecord extends Document {
  fileName?: string;
  status: BackupStatus;
  sizeBytes?: number;
  error?: string;
  jobId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const backupRecordSchema = new Schema<IBackupRecord>(
  {
    fileName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["QUEUED", "RUNNING", "COMPLETED", "FAILED"],
      default: "QUEUED",
      required: true,
    },
    sizeBytes: {
      type: Number,
      min: 0,
    },
    error: {
      type: String,
      trim: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "SystemJob",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

backupRecordSchema.index({ createdAt: -1 });
backupRecordSchema.index({ status: 1, createdAt: -1 });

export const BackupRecord = mongoose.model<IBackupRecord>(
  "BackupRecord",
  backupRecordSchema
);