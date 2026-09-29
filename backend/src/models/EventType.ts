import mongoose, { Schema, type Document } from "mongoose";

export type Slot = "AFTERNOON" | "EVENING" | "NIGHT" | "DAY";

interface LocalizedText {
  fr: string;
  ar: string;
  en: string;
}

export interface IEventType extends Document {
  key: string;
  name: LocalizedText;
  description: LocalizedText;
  coverImage?: string;
  womenCapacity: number;
  menCapacity: number;
  durationHours: number;
  bufferMinutes?: number;
  allowedSlots: Slot[];
  recommendedPackKey?: string;
  depositPercent: number;
  active: boolean;
  diasporaDepositPercent?: number;
}

const localizedTextSchema = new Schema<LocalizedText>(
  {
    fr: { type: String, required: true },
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  { _id: false }
);

const eventTypeSchema = new Schema<IEventType>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    coverImage: { type: String },
    womenCapacity: { type: Number, required: true, min: 0 },
    menCapacity: { type: Number, required: true, min: 0 },
    durationHours: { type: Number, required: true, min: 1 },
    bufferMinutes: {
  type: Number,
  default: 0,
  min: 0,
  max: 1440,
},
    allowedSlots: {
      type: [String],
      enum: ["AFTERNOON", "EVENING", "NIGHT", "DAY"],
      required: true,
    },
    recommendedPackKey: { type: String },
    depositPercent: { type: Number, required: true, min: 0, max: 100 },
    diasporaDepositPercent: {type: Number,min: 0,max: 100,},
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const EventType = mongoose.model<IEventType>(
  "EventType",
  eventTypeSchema
);