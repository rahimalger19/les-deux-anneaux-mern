import mongoose, { Schema } from "mongoose";
import { BOOKING_SLOTS, type BookingSlot } from "./Booking";

export const AVAILABILITY_BLOCK_TYPES = [
  "MAINTENANCE",
  "MANUAL",
  "PREPARATION_BUFFER",
] as const;

export type AvailabilityBlockType =
  (typeof AVAILABILITY_BLOCK_TYPES)[number];

export interface IAvailabilityBlock {
  spaceKey: string;
  eventDate: string;
  slots: BookingSlot[];
  type: AvailabilityBlockType;
  reason?: string;
  createdBy: mongoose.Types.ObjectId;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const availabilityBlockSchema = new Schema<IAvailabilityBlock>(
  {
    spaceKey: {
      type: String,
      required: true,
      default: "main-hall",
      trim: true,
    },
    eventDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    slots: [
      {
        type: String,
        enum: BOOKING_SLOTS,
        required: true,
      },
    ],
    type: {
      type: String,
      enum: AVAILABILITY_BLOCK_TYPES,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true }
);

availabilityBlockSchema.index({
  spaceKey: 1,
  eventDate: 1,
  active: 1,
});
availabilityBlockSchema.index(
  {
    spaceKey: 1,
    eventDate: 1,
    type: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      active: true,
    },
  }
);
export const AvailabilityBlock = mongoose.model<IAvailabilityBlock>(
  "AvailabilityBlock",
  availabilityBlockSchema
);