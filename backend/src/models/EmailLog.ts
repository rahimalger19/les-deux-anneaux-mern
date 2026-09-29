import mongoose, { Schema, type Document } from "mongoose";

export interface IEmailLog extends Document {
  to: string;
  subject: string;
  templateKey?: string;
  language?: string;
  status: "SENT" | "FAILED";
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const emailLogSchema = new Schema<IEmailLog>(
  {
    to: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    templateKey: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["SENT", "FAILED"],
      required: true,
    },
    error: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

emailLogSchema.index({ createdAt: -1 });

export const EmailLog = mongoose.model<IEmailLog>(
  "EmailLog",
  emailLogSchema
);