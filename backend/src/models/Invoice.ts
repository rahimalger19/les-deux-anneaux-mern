import mongoose, { Schema } from "mongoose";

export interface IInvoice {
  bookingId: mongoose.Types.ObjectId;

  invoiceNumber: string;

  amountDZD: number;

  status: "ISSUED" | "PAID";

  issuedAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    amountDZD: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["ISSUED", "PAID"],
      default: "ISSUED",
      required: true,
    },

    issuedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Invoice = mongoose.model<IInvoice>(
  "Invoice",
  invoiceSchema
);