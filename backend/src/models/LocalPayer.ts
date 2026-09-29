import mongoose, { Schema } from "mongoose";
import type { PaymentMethod } from "./Payment";

export interface ILocalPayer {
  clientUserId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  relationship: string;
  paymentMethod: PaymentMethod;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const localPayerSchema = new Schema<ILocalPayer>(
  {
    clientUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    relationship: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    paymentMethod: {
      type: String,
      enum: ["CCP", "BARIDIMOB", "VIREMENT"],
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

localPayerSchema.index({
  clientUserId: 1,
  bookingId: 1,
  active: 1,
});

export const LocalPayer = mongoose.model<ILocalPayer>(
  "LocalPayer",
  localPayerSchema
);