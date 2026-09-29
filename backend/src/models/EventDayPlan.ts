import mongoose, { Schema } from "mongoose";

export interface IRunSheetEntry {
  time: string;
  dayOffset: 0 | 1;
  label: string;
  staffUserId?: mongoose.Types.ObjectId;
  notes?: string;
}

export interface IEventDayPlan {
  bookingId: mongoose.Types.ObjectId;
  entries: IRunSheetEntry[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const runSheetEntrySchema = new Schema<IRunSheetEntry>(
  {
    time: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    dayOffset: {
      type: Number,
      enum: [0, 1],
      default: 0,
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    staffUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { _id: true }
);

const eventDayPlanSchema = new Schema<IEventDayPlan>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },
    entries: {
      type: [runSheetEntrySchema],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const EventDayPlan = mongoose.model<IEventDayPlan>(
  "EventDayPlan",
  eventDayPlanSchema
);