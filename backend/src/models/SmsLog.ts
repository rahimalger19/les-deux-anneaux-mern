import mongoose, { Schema, type Document } from "mongoose";

export type SmsLogStatus = "SENT" | "FAILED" | "SKIPPED";

export interface ISmsLog extends Document {
  provider: string;
  senderLabel: string;
  phoneMasked: string;
  status: SmsLogStatus;
  providerMessageId?: string;
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const smsLogSchema = new Schema<ISmsLog>(
  {
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    senderLabel: {
      type: String,
      required: true,
      trim: true,
    },
    phoneMasked: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["SENT", "FAILED", "SKIPPED"],
      required: true,
    },
    providerMessageId: {
      type: String,
      trim: true,
    },
    error: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

smsLogSchema.index({ createdAt: -1 });

export const SmsLog = mongoose.model<ISmsLog>(
  "SmsLog",
  smsLogSchema
);