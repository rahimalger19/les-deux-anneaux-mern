import mongoose, { Schema } from "mongoose";

export interface IProForma {
  bookingId: mongoose.Types.ObjectId;
  proFormaNumber: string;
  totalDZD: number;
  depositDZD: number;
  issuedAt: Date;
  issuedBy?: mongoose.Types.ObjectId;
  sentTo?: string;
  sentAt?: Date;
  downloadTokenHash?: string;
  downloadTokenExpiresAt?: Date;
}

const proFormaSchema = new Schema<IProForma>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    proFormaNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    totalDZD: {
      type: Number,
      required: true,
      min: 0,
    },
    depositDZD: {
      type: Number,
      required: true,
      min: 0,
    },
    issuedAt: {
      type: Date,
      required: true,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    sentTo: {
      type: String,
      trim: true,
      lowercase: true,
    },
    sentAt: {
      type: Date,
    },
    downloadTokenHash: {
      type: String,
      select: false,
    },
    downloadTokenExpiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

proFormaSchema.index(
  { downloadTokenHash: 1 },
  { unique: true, sparse: true }
);

export const ProForma = mongoose.model<IProForma>(
  "ProForma",
  proFormaSchema
);