import mongoose, { Schema, type Document } from "mongoose";

export const SMS_PROVIDERS = ["TWILIO"] as const;

export type SmsProvider = (typeof SMS_PROVIDERS)[number];

export interface ISmsConfiguration extends Document {
  key: string;
  provider: SmsProvider;
  enabled: boolean;
  senderLabel: string;
  otpTtlSeconds: number;
  otpTemplate: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const smsConfigurationSchema = new Schema<ISmsConfiguration>(
  {
    key: {
      type: String,
      default: "default",
      required: true,
      unique: true,
    },
    provider: {
      type: String,
      enum: SMS_PROVIDERS,
      default: "TWILIO",
      required: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    senderLabel: {
      type: String,
      default: "Les Deux Anneaux",
      required: true,
      trim: true,
    },
    otpTtlSeconds: {
      type: Number,
      default: 300,
      required: true,
      min: 60,
    },
    otpTemplate: {
      type: String,
      default:
        "Votre code Les Deux Anneaux est {{code}}. Il expire dans {{minutes}} minutes.",
      required: true,
    },
  },
  { timestamps: true }
);

export const SmsConfiguration = mongoose.model<ISmsConfiguration>(
  "SmsConfiguration",
  smsConfigurationSchema
);