import mongoose, { Schema, type Document } from "mongoose";

export type NewsletterDeliveryStatus = "SENT" | "FAILED";

export interface INewsletterDelivery extends Document {
  campaignId: mongoose.Types.ObjectId;
  subscriberId: mongoose.Types.ObjectId;
  email: string;
  status: NewsletterDeliveryStatus;
  error?: string;
  sentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const newsletterDeliverySchema = new Schema<INewsletterDelivery>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "NewsletterCampaign",
      required: true,
    },
    subscriberId: {
      type: Schema.Types.ObjectId,
      ref: "NewsletterSubscriber",
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["SENT", "FAILED"],
      required: true,
    },
    error: {
      type: String,
      trim: true,
    },
    sentAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

newsletterDeliverySchema.index(
  { campaignId: 1, subscriberId: 1 },
  { unique: true }
);

newsletterDeliverySchema.index({ campaignId: 1, status: 1 });

export const NewsletterDelivery = mongoose.model<INewsletterDelivery>(
  "NewsletterDelivery",
  newsletterDeliverySchema
);