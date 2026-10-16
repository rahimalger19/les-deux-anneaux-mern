import mongoose, { Schema } from "mongoose";

export interface IGalleryFavorite {
  userId: mongoose.Types.ObjectId;
  galleryItemId: mongoose.Types.ObjectId;
  collectionName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const galleryFavoriteSchema = new Schema<IGalleryFavorite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    galleryItemId: {
      type: Schema.Types.ObjectId,
      ref: "GalleryItem",
      required: true,
    },
    collectionName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      default: "Inspiration",
    },
  },
  { timestamps: true }
);

galleryFavoriteSchema.index(
  { userId: 1, galleryItemId: 1, collectionName: 1 },
  { unique: true }
);

export const GalleryFavorite = mongoose.model<IGalleryFavorite>(
  "GalleryFavorite",
  galleryFavoriteSchema
);