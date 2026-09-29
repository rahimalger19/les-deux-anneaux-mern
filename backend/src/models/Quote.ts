import mongoose, { Schema } from "mongoose";
import type { BookingSlot } from "./Booking";

export const QUOTE_STATUSES = [
  "DRAFT",
  "OVERRIDE_REQUESTED",
  "APPROVED",
  "REJECTED",
] as const;

export interface IQuote {
  userId: mongoose.Types.ObjectId;
  eventTypeKey: string;
  packKey: string;
  slot: BookingSlot;
  pricingMarket: "RESIDENT" | "DIASPORA";
  womenGuests: number;
  menGuests: number;
  totalDZD: number;
  depositDZD: number;
  status: (typeof QUOTE_STATUSES)[number];
  customRequest?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const quoteSchema = new Schema<IQuote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventTypeKey: {
      type: String,
      required: true,
    },
    packKey: {
      type: String,
      required: true,
    },
    slot: {
      type: String,
      enum: ["AFTERNOON", "EVENING", "NIGHT", "DAY"],
      required: true,
    },
    pricingMarket: {
         type: String,
          required: true,
           enum: ["RESIDENT", "DIASPORA"] },
    womenGuests: {
      type: Number,
      required: true,
      min: 0,
    },
    menGuests: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDZD: {
      type: Number,
      required: true,
    },
    depositDZD: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: QUOTE_STATUSES,
      default: "DRAFT",
    },
    customRequest: {
      type: String,
      trim: true,
      maxlength: 1500,
    },
  },
  { timestamps: true }
);

export const Quote = mongoose.model<IQuote>("Quote", quoteSchema);