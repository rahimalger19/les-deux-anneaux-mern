import mongoose, { Schema } from "mongoose";

interface LocalizedText {
  fr: string;
  ar: string;
  en: string;
}

export interface IService {
  key: string;
  category: "VENUE" | "SALON" | "STAGE" | "SOUND" | "STAFF" | "OPTION";
  name: LocalizedText;
  description: LocalizedText;
  priceDZD?: number;
  image?: string;
  active: boolean;
}

const localizedTextSchema = new Schema<LocalizedText>(
  {
    fr: { type: String, required: true },
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  { _id: false }
);

const serviceSchema = new Schema<IService>(
  {
    key: { type: String, required: true, unique: true, trim: true },

    category: {
      type: String,
      enum: ["VENUE", "SALON", "STAGE", "SOUND", "STAFF", "OPTION"],
      required: true,
    },

    name: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },

    priceDZD: { type: Number, min: 0 },

    image: { type: String },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Service = mongoose.model<IService>("Service", serviceSchema);