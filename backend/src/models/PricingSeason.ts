import mongoose, { Schema, type Document } from "mongoose";

export type PricingSeasonKey = "LOW" | "HIGH";

export interface IPricingSeason extends Document {
  key: PricingSeasonKey;
  startMonthDay: string;
  endMonthDay: string;
  priority: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const pricingSeasonSchema = new Schema<IPricingSeason>(
  {
    key: {
      type: String,
      enum: ["LOW", "HIGH"],
      required: true,
    },
    startMonthDay: {
      type: String,
      required: true,
      match: /^\d{2}-\d{2}$/,
    },
    endMonthDay: {
      type: String,
      required: true,
      match: /^\d{2}-\d{2}$/,
    },
    priority: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

pricingSeasonSchema.index({ key: 1, startMonthDay: 1, endMonthDay: 1 });

export const PricingSeason = mongoose.model<IPricingSeason>(
  "PricingSeason",
  pricingSeasonSchema
);