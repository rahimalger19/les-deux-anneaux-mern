import mongoose, { Schema, type Document } from "mongoose";

export const EMAIL_TEMPLATE_KEYS = [
  "NEWSLETTER_CONFIRMATION",
  "PASSWORD_RESET",
  "PROFORMA",
  "CONTACT_REPLY",
] as const;

export const EMAIL_TEMPLATE_LANGUAGES = ["fr", "ar", "en"] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];
export type EmailTemplateLanguage =
  (typeof EMAIL_TEMPLATE_LANGUAGES)[number];

export interface IEmailTemplate extends Document {
  key: EmailTemplateKey;
  language: EmailTemplateLanguage;
  subject: string;
  content: string;
  format: "HTML" | "MJML";
  createdAt?: Date;
  updatedAt?: Date;
}

const emailTemplateSchema = new Schema<IEmailTemplate>(
  {
    key: {
      type: String,
      enum: EMAIL_TEMPLATE_KEYS,
      required: true,
    },
    language: {
      type: String,
      enum: EMAIL_TEMPLATE_LANGUAGES,
      required: true,
      default: "fr",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      enum: ["HTML", "MJML"],
      required: true,
      default: "HTML",
    },
  },
  { timestamps: true }
);

emailTemplateSchema.index({ key: 1, language: 1 }, { unique: true });

export const EmailTemplate = mongoose.model<IEmailTemplate>(
  "EmailTemplate",
  emailTemplateSchema
);