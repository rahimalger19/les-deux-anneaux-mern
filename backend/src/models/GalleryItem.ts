import mongoose, { Schema } from "mongoose";

interface LocalizedText {
  fr: string;
  ar: string;
  en: string;
}

export interface IGalleryItem {
  album: string;
  eventTypeKey: string;
  title: LocalizedText;
  imageUrl: string;
  likeCount: number;
  active: boolean;
  sortOrder: number;
  imageRightsConfirmed: boolean;
  imageRightsConfirmedAt?: Date;
  imageRightsConfirmedBy?: mongoose.Types.ObjectId;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const localizedTextSchema = new Schema<LocalizedText>(
  {
    fr: { type: String, required: true, trim: true, maxlength: 160 },
    ar: { type: String, required: true, trim: true, maxlength: 160 },
    en: { type: String, required: true, trim: true, maxlength: 160 },
  },
  { _id: false }
);

const galleryItemSchema = new Schema<IGalleryItem>(
  {
    album: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    eventTypeKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    title: {
      type: localizedTextSchema,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
      required: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    imageRightsConfirmed: {
      type: Boolean,
      default: false,
      required: true,
    },
    imageRightsConfirmedAt: {
      type: Date,
    },
    imageRightsConfirmedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

galleryItemSchema.index({
  eventTypeKey: 1,
  album: 1,
  active: 1,
  sortOrder: 1,
});

export const GalleryItem = mongoose.model<IGalleryItem>(
  "GalleryItem",
  galleryItemSchema
);