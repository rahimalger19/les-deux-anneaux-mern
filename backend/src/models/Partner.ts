import mongoose, { Schema } from "mongoose";

export type PartnerCategory =
  | "CATERER"
  | "DECOR"
  | "PHOTO"
  | "DJ"
  | "HOTEL";

export interface IPartner {
  name: string;
  category: PartnerCategory;
  logoUrl: string;
  websiteUrl: string;
  promoCode?: string;
  displayOrder: number;
  clickCount: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const partnerSchema = new Schema<IPartner>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["CATERER", "DECOR", "PHOTO", "DJ", "HOTEL"],
      required: true,
    },
    logoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    websiteUrl: {
      type: String,
      required: true,
      trim: true,
    },
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

partnerSchema.index({ active: 1, displayOrder: 1 });

export const Partner = mongoose.model<IPartner>(
  "Partner",
  partnerSchema
);