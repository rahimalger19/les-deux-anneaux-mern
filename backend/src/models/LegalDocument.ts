import mongoose, { Schema, type Document } from "mongoose";

export const LEGAL_DOCUMENT_KEYS = [
  "mentions-legales",
  "cgv",
  "confidentialite",
  "cookies",
  "annulation",
] as const;

export type LegalDocumentKey = (typeof LEGAL_DOCUMENT_KEYS)[number];

type LocalizedText = {
  fr: string;
  ar: string;
  en: string;
};

export interface ILegalDocument extends Document {
  key: LegalDocumentKey;
  title: LocalizedText;
  content: LocalizedText;
  published: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const localizedTextSchema = new Schema<LocalizedText>(
  {
    fr: { type: String, required: true },
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  { _id: false }
);

const legalDocumentSchema = new Schema<ILegalDocument>(
  {
    key: {
      type: String,
      enum: LEGAL_DOCUMENT_KEYS,
      unique: true,
      required: true,
    },
    title: {
      type: localizedTextSchema,
      required: true,
    },
    content: {
      type: localizedTextSchema,
      required: true,
    },
    published: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const LegalDocument = mongoose.model<ILegalDocument>(
  "LegalDocument",
  legalDocumentSchema
);