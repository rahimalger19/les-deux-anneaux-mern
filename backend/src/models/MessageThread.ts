import mongoose, { Schema } from "mongoose";

export interface IMessageThread {
  userId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  subject: string;
  lastMessageAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const messageThreadSchema = new Schema<IMessageThread>(
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
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

messageThreadSchema.index({ userId: 1, lastMessageAt: -1 });

export const MessageThread = mongoose.model<IMessageThread>(
  "MessageThread",
  messageThreadSchema
);