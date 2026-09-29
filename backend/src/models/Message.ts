import mongoose, { Schema } from "mongoose";

export interface IMessage {
  threadId: mongoose.Types.ObjectId;
  senderType: "CLIENT" | "HALL";
  senderId?: mongoose.Types.ObjectId;
  body: string;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    threadId: {
      type: Schema.Types.ObjectId,
      ref: "MessageThread",
      required: true,
      index: true,
    },
    senderType: {
      type: String,
      enum: ["CLIENT", "HALL"],
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

messageSchema.index({ threadId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);