import mongoose, { Schema } from "mongoose";

export interface IDocumentCounter {
  type: "PRO" | "FACT";
  year: number;
  sequence: number;
}

const documentCounterSchema = new Schema<IDocumentCounter>({
  type: {
    type: String,
    enum: ["PRO", "FACT"],
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  sequence: {
    type: Number,
    default: 0,
  },
});

documentCounterSchema.index({ type: 1, year: 1 }, { unique: true });

export const DocumentCounter = mongoose.model<IDocumentCounter>(
  "DocumentCounter",
  documentCounterSchema
);