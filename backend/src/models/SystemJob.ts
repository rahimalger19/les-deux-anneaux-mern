import mongoose, { Schema, type Document } from "mongoose";

export type SystemJobType = "DATABASE_BACKUP";
export type SystemJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export interface ISystemJob extends Document {
  type: SystemJobType;
  status: SystemJobStatus;
  payload?: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  error?: string;
  runAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const systemJobSchema = new Schema<ISystemJob>(
  {
    type: {
      type: String,
      enum: ["DATABASE_BACKUP"],
      required: true,
    },
    status: {
      type: String,
      enum: ["QUEUED", "RUNNING", "COMPLETED", "FAILED"],
      default: "QUEUED",
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: 1,
    },
    error: {
      type: String,
      trim: true,
    },
    runAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

systemJobSchema.index({ status: 1, runAt: 1 });

export const SystemJob = mongoose.model<ISystemJob>(
  "SystemJob",
  systemJobSchema
);