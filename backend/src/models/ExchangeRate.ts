import mongoose, { Schema, type Document } from "mongoose";

export type DisplayCurrency = "EUR" | "USD";

export interface IExchangeRate extends Document {
  currency: DisplayCurrency;
  dzdPerUnit: number;
  active: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const exchangeRateSchema = new Schema<IExchangeRate>(
  {
    currency: {
      type: String,
      enum: ["EUR", "USD"],
      required: true,
      unique: true,
    },
    dzdPerUnit: {
      type: Number,
      required: true,
      min: 0.000001,
    },
    active: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const ExchangeRate = mongoose.model<IExchangeRate>(
  "ExchangeRate",
  exchangeRateSchema
);