import mongoose, { Schema, type Document } from "mongoose";

export interface IPaymentMethodConfiguration {
  enabled: boolean;
  label: string;
  details: string;
}

export interface IPaymentConfiguration extends Document {
  key: string;
  brandName: string;
  legalName: string;

  logoUrl?: string;
  logoDarkUrl?: string;

  ccpRip: string;
  nif: string;
  rc: string;
  whatsappNumber: string;
  openingHours: string;

  ccp: IPaymentMethodConfiguration;
  baridiMob: IPaymentMethodConfiguration;
  bankTransfer: IPaymentMethodConfiguration;

  createdAt?: Date;
  updatedAt?: Date;
}

const methodSchema = new Schema<IPaymentMethodConfiguration>(
  {
    enabled: { type: Boolean, default: false },
    label: { type: String, required: true, trim: true },
    details: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const paymentConfigurationSchema = new Schema<IPaymentConfiguration>(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
      required: true,
    },

    brandName: {
      type: String,
      default: "Les Deux Anneaux",
      required: true,
      trim: true,
    },

    legalName: {
      type: String,
      default: "Les Deux Anneaux",
      required: true,
      trim: true,
    },

    logoUrl: {
      type: String,
      trim: true,
    },

    logoDarkUrl: {
      type: String,
      trim: true,
    },

    ccpRip: {
      type: String,
      default: "",
      trim: true,
    },

    nif: {
      type: String,
      default: "",
      trim: true,
    },

    rc: {
      type: String,
      default: "",
      trim: true,
    },

    whatsappNumber: {
      type: String,
      default: "",
      trim: true,
    },

    openingHours: {
      type: String,
      default: "",
      trim: true,
    },

    ccp: {
      type: methodSchema,
      default: () => ({
        enabled: false,
        label: "CCP",
        details: "",
      }),
    },

    baridiMob: {
      type: methodSchema,
      default: () => ({
        enabled: false,
        label: "BaridiMob",
        details: "",
      }),
    },

    bankTransfer: {
      type: methodSchema,
      default: () => ({
        enabled: false,
        label: "Virement bancaire",
        details: "",
      }),
    },
  },
  { timestamps: true }
);

export const PaymentConfiguration = mongoose.model<IPaymentConfiguration>(
  "PaymentConfiguration",
  paymentConfigurationSchema
);