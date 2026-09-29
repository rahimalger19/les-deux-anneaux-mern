import mongoose, { Schema, type Document } from "mongoose";
import type { Slot } from "./EventType";

export const PRICING_MARKETS = ["RESIDENT", "DIASPORA"] as const;
export const PRICING_DAY_TYPES = ["ALL", "WEEKDAY", "WEEKEND"] as const;

export type PricingMarket = (typeof PRICING_MARKETS)[number];
export type PricingDayType = (typeof PRICING_DAY_TYPES)[number];

export interface IPricingRule extends Document {
  slot: Slot;
  season: "LOW" | "NORMAL" | "HIGH";
  dayType: PricingDayType;
  minGuests: number;
  maxGuests: number;
  priceDZD: number;
  active: boolean;
  market: PricingMarket;
}

const pricingRuleSchema = new Schema<IPricingRule>(
  {
    market: {
      type: String,
      enum: PRICING_MARKETS,
      required: true,
      default: "RESIDENT",
    },
    slot: {
      type: String,
      enum: ["AFTERNOON", "EVENING", "NIGHT", "DAY"],
      required: true,
    },
    season: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH"],
      default: "NORMAL",
      required: true,
    },
    dayType: {
      type: String,
      enum: PRICING_DAY_TYPES,
      default: "ALL",
      required: true,
    },
    minGuests: { type: Number, required: true, min: 1 },
    maxGuests: { type: Number, required: true, min: 1 },
    priceDZD: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

pricingRuleSchema.index({
  market: 1,
  slot: 1,
  season: 1,
  dayType: 1,
  minGuests: 1,
  maxGuests: 1,
});

export const PricingRule = mongoose.model<IPricingRule>(
  "PricingRule",
  pricingRuleSchema
);