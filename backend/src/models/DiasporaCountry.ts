import mongoose, { Schema, type Document } from "mongoose";

export interface IDiasporaCountry extends Document {
  code: string;
  name: string;
  active: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const diasporaCountrySchema = new Schema<IDiasporaCountry>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{2}$/,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

diasporaCountrySchema.index({ active: 1, name: 1 });

export const DiasporaCountry = mongoose.model<IDiasporaCountry>(
  "DiasporaCountry",
  diasporaCountrySchema
);