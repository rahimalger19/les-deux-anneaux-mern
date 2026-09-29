import mongoose, { Schema } from "mongoose";

export interface IReviewLike {
  reviewId: mongoose.Types.ObjectId;
  visitorHash: string;
  createdAt?: Date;
}

const reviewLikeSchema = new Schema<IReviewLike>(
  {
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: "Review",
      required: true,
      index: true,
    },
    visitorHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

reviewLikeSchema.index(
  { reviewId: 1, visitorHash: 1 },
  { unique: true }
);

export const ReviewLike = mongoose.model<IReviewLike>(
  "ReviewLike",
  reviewLikeSchema
);