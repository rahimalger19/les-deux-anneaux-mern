import mongoose, { Schema, type Document } from "mongoose";

interface LocalizedText {
  fr: string;
  ar: string;
  en: string;
}

export interface IPack extends Document {
  key: string;
  name: LocalizedText;
  description: LocalizedText;
  basePriceDZD: number;
  extraGuestPriceDZD: number;
  includedItems: string[];
  active: boolean;
  includedGuests: number;
  diasporaBasePriceDZD?: number;
  diasporaExtraGuestPriceDZD?: number;
}

const localizedTextSchema = new Schema<LocalizedText>(
  {
    fr: { type: String, required: true },
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  { _id: false }
);

const packSchema = new Schema<IPack>(
  
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    basePriceDZD: { type: Number, required: true, min: 0 },
    extraGuestPriceDZD: { type: Number, required: true, min: 0 },
    includedGuests: {type: Number,required: true,min: 0,},
    diasporaBasePriceDZD: {type: Number, min: 0,},
    diasporaExtraGuestPriceDZD: {type: Number,min: 0,},
    includedItems: [{ type: String, required: true }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Pack = mongoose.model<IPack>("Pack", packSchema);