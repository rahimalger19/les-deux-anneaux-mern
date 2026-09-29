import mongoose, { Schema } from "mongoose";

interface LocalizedText {
  fr: string;
  ar: string;
  en: string;
}

export interface ICustomPackTemplate {
  name: LocalizedText;
  description: LocalizedText;
  includedItems: string[];
  includedGuests: number;
  basePriceDZD: number;
  extraGuestPriceDZD: number;
  diasporaBasePriceDZD?: number;
  diasporaExtraGuestPriceDZD?: number;
  active: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const localizedTextSchema = new Schema<LocalizedText>(
  {
    fr: { type: String, required: true, trim: true },
    ar: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const customPackTemplateSchema = new Schema<ICustomPackTemplate>(
  {
    name: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    includedItems: [{ type: String, required: true }],
    includedGuests: { type: Number, required: true, min: 0 },
    basePriceDZD: { type: Number, required: true, min: 0 },
    extraGuestPriceDZD: { type: Number, required: true, min: 0 },
    diasporaBasePriceDZD: { type: Number, min: 0 },
    diasporaExtraGuestPriceDZD: { type: Number, min: 0 },
    active: { type: Boolean, default: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

customPackTemplateSchema.index({ active: 1, createdAt: -1 });

export const CustomPackTemplate =
  mongoose.model<ICustomPackTemplate>(
    "CustomPackTemplate",
    customPackTemplateSchema
  );