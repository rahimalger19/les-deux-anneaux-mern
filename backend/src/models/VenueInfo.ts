import mongoose, { Schema } from "mongoose";

export interface IVenueInfo {
  womenCapacity?: number;
  menCapacity?: number;
  spaces: string[];
  parking?: string;
  openingHours?: string;
  virtualVisitImages: string[];
  published: boolean;
}

const venueInfoSchema = new Schema<IVenueInfo>(
  {
    womenCapacity: { type: Number, min: 0 },
    menCapacity: { type: Number, min: 0 },

    spaces: [{ type: String }],

    parking: { type: String },

    openingHours: { type: String },

    virtualVisitImages: [{ type: String }],

    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const VenueInfo = mongoose.model<IVenueInfo>(
  "VenueInfo",
  venueInfoSchema
);