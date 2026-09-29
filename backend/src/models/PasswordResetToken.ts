import mongoose, { Schema, type Document } from "mongoose";

export const PASSWORD_RESET_CHANNELS = ["EMAIL", "SMS"] as const;

export type PasswordResetChannel =
  (typeof PASSWORD_RESET_CHANNELS)[number];

export interface IPasswordResetToken extends Document {
  userId: mongoose.Types.ObjectId;
  channel: PasswordResetChannel;
  tokenHash: string;
  attempts: number;
  expiresAt: Date;
  usedAt?: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: PASSWORD_RESET_CHANNELS,
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    attempts: {
      type: Number,
      default: 0,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

passwordResetTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export const PasswordResetToken =
  mongoose.model<IPasswordResetToken>(
    "PasswordResetToken",
    passwordResetTokenSchema
  );