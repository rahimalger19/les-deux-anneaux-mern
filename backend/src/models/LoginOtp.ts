import mongoose, { Schema } from "mongoose";

export const LOGIN_OTP_PURPOSES = [
  "PHONE_LOGIN",
  "TWO_FACTOR_LOGIN",
] as const;

export type LoginOtpPurpose = (typeof LOGIN_OTP_PURPOSES)[number];

export interface ILoginOtp {
  userId: mongoose.Types.ObjectId;
  purpose: LoginOtpPurpose;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  usedAt?: Date;
}

const loginOtpSchema = new Schema<ILoginOtp>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: LOGIN_OTP_PURPOSES,
      default: "PHONE_LOGIN",
      required: true,
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

loginOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const LoginOtp = mongoose.model<ILoginOtp>(
  "LoginOtp",
  loginOtpSchema
);