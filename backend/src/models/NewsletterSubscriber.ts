import mongoose, { Schema } from "mongoose";

export type NewsletterStatus =
  | "PENDING"
  | "CONFIRMED"
  | "UNSUBSCRIBED";

export interface INewsletterSubscriber {
  email: string;
  phone: string;
  language: "fr-DZ" | "ar-DZ" | "en";
  status: NewsletterStatus;
  confirmationToken?: string;
  unsubscribeToken: string;
  confirmedAt?: Date;
  unsubscribedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const newsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: String,
      enum: ["fr-DZ", "ar-DZ", "en"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "UNSUBSCRIBED"],
      default: "PENDING",
      required: true,
    },
    confirmationToken: {
      type: String,
    },
    unsubscribeToken: {
      type: String,
      required: true,
      unique: true,
    },
    confirmedAt: {
      type: Date,
    },
    unsubscribedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const NewsletterSubscriber = mongoose.model<INewsletterSubscriber>(
  "NewsletterSubscriber",
  newsletterSubscriberSchema
);