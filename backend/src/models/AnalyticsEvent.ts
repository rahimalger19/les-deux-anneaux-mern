import mongoose, { Schema, type Document } from "mongoose";

export type AnalyticsEventType =
  | "PAGE_VIEW"
  | "RESERVATION_ESTIMATE"
  | "BOOKING_DRAFT_CREATED"
  | "OTP_VERIFIED";

export type AnalyticsJourney = "GUEST" | "ACCOUNT";

export interface IAnalyticsEvent extends Document {
  type: AnalyticsEventType;
  path?: string;
  visitorId: string;
  userId?: mongoose.Types.ObjectId;
  journey: AnalyticsJourney;
  country?: string;
  ip?: string;
  device: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    type: {
      type: String,
      enum: [
        "PAGE_VIEW",
        "RESERVATION_ESTIMATE",
        "BOOKING_DRAFT_CREATED",
        "OTP_VERIFIED",
      ],
      required: true,
    },
    path: {
      type: String,
      trim: true,
    },
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    journey: {
      type: String,
      enum: ["GUEST", "ACCOUNT"],
      required: true,
      default: "GUEST",
    },
    country: {
      type: String,
      trim: true,
      uppercase: true,
    },
    ip: {
      type: String,
      trim: true,
    },
    device: {
      type: String,
      required: true,
      trim: true,
    },
    utmSource: {
      type: String,
      trim: true,
    },
    utmMedium: {
      type: String,
      trim: true,
    },
    utmCampaign: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

analyticsEventSchema.index({ type: 1, createdAt: -1 });
analyticsEventSchema.index({ journey: 1, createdAt: -1 });
analyticsEventSchema.index({ utmSource: 1, createdAt: -1 });
analyticsEventSchema.index({ country: 1, createdAt: -1 });

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>(
  "AnalyticsEvent",
  analyticsEventSchema
);