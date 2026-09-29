import mongoose, { Schema } from "mongoose";

export interface IGalleryLike {
  galleryItemId: mongoose.Types.ObjectId;
  visitorHash: string;
  createdAt?: Date;
}

const galleryLikeSchema = new Schema<IGalleryLike>(
  {
    galleryItemId: {
      type: Schema.Types.ObjectId,
      ref: "GalleryItem",
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

galleryLikeSchema.index(
  { galleryItemId: 1, visitorHash: 1 },
  { unique: true }
);

export const GalleryLike = mongoose.model<IGalleryLike>(
  "GalleryLike",
  galleryLikeSchema
);