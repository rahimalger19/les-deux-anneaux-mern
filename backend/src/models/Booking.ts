import mongoose, { Schema } from "mongoose";

export const PRICING_MARKETS = ["RESIDENT", "DIASPORA"] as const;

export type PricingMarket = (typeof PRICING_MARKETS)[number];
export const BOOKING_SOURCES = ["ONLINE", "WALK_IN"] as const;

export type BookingSource = (typeof BOOKING_SOURCES)[number];
export const BOOKING_SLOTS = ["AFTERNOON", "EVENING", "NIGHT", "DAY"] as const;

export const BOOKING_STATUSES = [
  "DRAFT",
  "PRICED",
  "OTP_PENDING",
  "HELD",
  "PROOF_PENDING",
  "PAID",
  "INVOICED",
  "DONE",
  "CANCELLED",
  "EXPIRED",
] as const;

export type BookingSlot = (typeof BOOKING_SLOTS)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface IBooking {
  userId?: mongoose.Types.ObjectId;
  source: BookingSource;
assignedAgent?: mongoose.Types.ObjectId;
adminNotes?: string;
priceOverrideDZD?: number;
priceOverrideReason?: string;
  guestToken?: string;
  guestPhone?: string;

  spaceKey: string;
  eventTypeKey: string;
  eventDate: string;
  slot: BookingSlot;

  womenGuests: number;
  menGuests: number;
  packKey?: string;
  optionKeys: string[];
  pricingMarket: PricingMarket;

  currency: "DZD" | "EUR" | "USD";
  totalDZD: number;
  depositDZD: number;

  status: BookingStatus;
  holdExpiresAt?: Date;

  activeSlotKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    source: {
  type: String,
  enum: BOOKING_SOURCES,
  default: "ONLINE",
  required: true,
},
assignedAgent: {
  type: Schema.Types.ObjectId,
  ref: "User",
},
adminNotes: {
  type: String,
  trim: true,
  maxlength: 3000,
},
priceOverrideDZD: {
  type: Number,
  min: 0,
},
priceOverrideReason: {
  type: String,
  trim: true,
  maxlength: 1000,
},
    guestToken: { type: String, index: true },
    guestPhone: { type: String },

    spaceKey: {
      type: String,
      required: true,
      default: "main-hall",
    },
    eventTypeKey: { type: String, required: true },
    eventDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    slot: {
      type: String,
      enum: BOOKING_SLOTS,
      required: true,
    },

    womenGuests: { type: Number, default: 0, min: 0 },
    menGuests: { type: Number, default: 0, min: 0 },
    packKey: { type: String },
    optionKeys: [{ type: String }],
    pricingMarket: {
  type: String,
  enum: PRICING_MARKETS,
  required: true,
  default: "RESIDENT",
},

    currency: {
      type: String,
      enum: ["DZD", "EUR", "USD"],
      default: "DZD",
    },
    totalDZD: { type: Number, default: 0, min: 0 },
    depositDZD: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "DRAFT",
    },
    holdExpiresAt: { type: Date },

    activeSlotKey: {
      type: String,
      
    },
  },
  { timestamps: true }
);

/*
  Only held/confirmed bookings will receive activeSlotKey later.
  MongoDB then prevents two active bookings in the same hall/date/slot.
*/
bookingSchema.index(
  { activeSlotKey: 1 },
  { unique: true, sparse: true }
);

bookingSchema.index({ eventDate: 1, slot: 1, spaceKey: 1 });

export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);