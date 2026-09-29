import mongoose, { Schema, type Document } from "mongoose";

export const NEWSLETTER_SEGMENTS = [
  "ALL",
  "fr-DZ",
  "ar-DZ",
  "en",
] as const;

export type NewsletterSegment =
  (typeof NEWSLETTER_SEGMENTS)[number];

export type NewsletterCampaignStatus =
  | "DRAFT"
  | "SENDING"
  | "SENT"
  | "PARTIAL_FAILURE";

export interface INewsletterCampaign extends Document {
  subject: string;
  html: string;
  segment: NewsletterSegment;
  status: NewsletterCampaignStatus;
  sentAt?: Date;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const newsletterCampaignSchema = new Schema<INewsletterCampaign>(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    html: {
      type: String,
      required: true,
    },
    segment: {
      type: String,
      enum: NEWSLETTER_SEGMENTS,
      default: "ALL",
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "SENDING", "SENT", "PARTIAL_FAILURE"],
      default: "DRAFT",
      required: true,
    },
    sentAt: {
      type: Date,
    },
    recipientCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

newsletterCampaignSchema.index({ createdAt: -1 });

export const NewsletterCampaign = mongoose.model<INewsletterCampaign>(
  "NewsletterCampaign",
  newsletterCampaignSchema
);