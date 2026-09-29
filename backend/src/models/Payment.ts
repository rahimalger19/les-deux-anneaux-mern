import mongoose, { Schema } from "mongoose";

export const PAYMENT_METHODS = [
  "CCP",
  "BARIDIMOB",
  "VIREMENT",
] as const;

export const PAYMENT_STATUSES = [
  "PENDING",
  "VERIFIED",
  "REJECTED",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface IPayment {
  bookingId: mongoose.Types.ObjectId;
  localPayerId?: mongoose.Types.ObjectId;
  method: PaymentMethod;
  amountDZD: number;
  reference?: string;
  proofUrl?: string;
  proofStorageKey?: string;
  proofFileName?: string;
  proofMimeType?: string;
  status: PaymentStatus;
  rejectionReason?: string;
  validatedBy?: mongoose.Types.ObjectId;
  validatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    localPayerId: {
      type: Schema.Types.ObjectId,
      ref: "LocalPayer",
    },
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },
    amountDZD: {
      type: Number,
      required: true,
      min: 0,
    },
    reference: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 120,
    },
    proofUrl: {
      type: String,
      trim: true,
      select: false,
    },
    proofStorageKey: {
      type: String,
      trim: true,
      maxlength: 255,
      select: false,
    },
    proofFileName: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    proofMimeType: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "PENDING",
      required: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    validatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    validatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ bookingId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

paymentSchema.index(
  { bookingId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "PENDING" },
  }
);

export const Payment = mongoose.model<IPayment>(
  "Payment",
  paymentSchema
);