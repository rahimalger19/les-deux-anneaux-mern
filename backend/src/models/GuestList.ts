import mongoose, { Schema } from "mongoose";

export interface IGuestListEntry {
  name: string;
  gender: "WOMAN" | "MAN";
}

export interface IGuestList {
  userId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  entries: IGuestListEntry[];
  womenCount: number;
  menCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const guestListEntrySchema = new Schema<IGuestListEntry>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    gender: {
      type: String,
      enum: ["WOMAN", "MAN"],
      required: true,
    },
  },
  { _id: false }
);

const guestListSchema = new Schema<IGuestList>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    entries: {
      type: [guestListEntrySchema],
      default: [],
    },
    womenCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    menCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export const GuestList = mongoose.model<IGuestList>(
  "GuestList",
  guestListSchema
);