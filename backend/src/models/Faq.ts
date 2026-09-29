import mongoose, { Schema } from "mongoose";

interface LocalizedText {
  fr: string;
  ar: string;
  en: string;
}

export interface IFaq {
  key: "PRICE" | "NIGHT" | "CCP" | "DIASPORA" | "CANCELLATION";
  question: LocalizedText;
  answer: LocalizedText;
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

const faqSchema = new Schema<IFaq>(
  {
    key: {
      type: String,
      enum: ["PRICE", "NIGHT", "CCP", "DIASPORA", "CANCELLATION"],
      required: true,
      unique: true,
    },

    question: { type: localizedTextSchema, required: true },
    answer: { type: localizedTextSchema, required: true },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Faq = mongoose.model<IFaq>("Faq", faqSchema);