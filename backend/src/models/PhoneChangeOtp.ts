import mongoose, { Schema } from "mongoose";

export interface IPhoneChangeOtp {
  userId: mongoose.Types.ObjectId;
  newPhone: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  usedAt?: Date;
}

const phoneChangeOtpSchema = new Schema<IPhoneChangeOtp>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    newPhone: {
      type: String,
      required: true,
      trim: true,
    },
    codeHash: {
      type: String,
      required: true,
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

phoneChangeOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PhoneChangeOtp = mongoose.model<IPhoneChangeOtp>(
  "PhoneChangeOtp",
  phoneChangeOtpSchema
);