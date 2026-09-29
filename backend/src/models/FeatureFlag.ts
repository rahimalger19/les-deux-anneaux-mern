import mongoose, { Schema, type Document } from "mongoose";

export interface IFeatureFlag extends Document {
  key: string;
  enabled: boolean;
  description: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const featureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const FeatureFlag = mongoose.model<IFeatureFlag>(
  "FeatureFlag",
  featureFlagSchema
);