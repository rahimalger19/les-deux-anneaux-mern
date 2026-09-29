import mongoose, { Schema } from "mongoose";

export interface IOtp {
  bookingId: mongoose.Types.ObjectId;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  usedAt?: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

/* MongoDB automatically removes expired OTP records. */
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model<IOtp>("Otp", otpSchema);