import mongoose, { Schema } from "mongoose";

export type ReviewStatus = "PENDING" | "PUBLISHED" | "HIDDEN";

export interface IReviewComment {
  authorName: string;
  message: string;
  createdAt: Date;
}

export interface IReview {
  userId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  authorName: string;
  rating: number;
  message: string;
  photoUrls: string[];
  verified: boolean;
  status: ReviewStatus;
  officialReply?: string;
  officialReplyBy?: mongoose.Types.ObjectId;
  officialRepliedAt?: Date;
  likeCount: number;
  comments: IReviewComment[];
  createdAt?: Date;
  updatedAt?: Date;
}

const reviewCommentSchema = new Schema<IReviewComment>(
  {
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const reviewSchema = new Schema<IReview>(
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
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    photoUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (urls: string[]) => urls.length <= 5,
        message: "A review can contain at most five photos",
      },
    },
    verified: {
      type: Boolean,
      default: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PUBLISHED", "HIDDEN"],
      default: "PENDING",
      required: true,
    },
    officialReply: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    officialReplyBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    officialRepliedAt: {
      type: Date,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    comments: {
      type: [reviewCommentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>("Review", reviewSchema);