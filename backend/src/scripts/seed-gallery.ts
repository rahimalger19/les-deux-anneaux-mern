import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { GalleryItem } from "../models/GalleryItem";

dotenv.config();

const galleryItems = [
  {
    album: "Mariage",
    eventTypeKey: "wedding",
    title: {
      fr: "Mariage",
      ar: "زفاف",
      en: "Wedding",
    },
    imageUrl: "/images/gallery/gallery-wedding-1.jpg",
    likeCount: 0,
    active: true,
  },
  {
    album: "Mariage",
    eventTypeKey: "wedding",
    title: {
      fr: "Détails de réception de mariage",
      ar: "تفاصيل حفل زفاف",
      en: "Wedding reception details",
    },
    imageUrl: "/images/gallery/gallery-wedding-2.jpg",
    likeCount: 0,
    active: true,
  },
  {
    album: "Fiançailles",
    eventTypeKey: "engagement",
    title: {
      fr: "Fiançailles",
      ar: "خطوبة",
      en: "Engagement",
    },
    imageUrl: "/images/gallery/gallery-engagement-1.jpg",
    likeCount: 0,
    active: true,
  },
  {
    album: "Réception familiale",
    eventTypeKey: "family-reception",
    title: {
      fr: "Réception familiale",
      ar: "استقبال عائلي",
      en: "Family reception",
    },
    imageUrl: "/images/gallery/gallery-family-1.jpg",
    likeCount: 0,
    active: true,
  },
];

async function seedGallery() {
  try {
    await connectDatabase();

    for (const item of galleryItems) {
      await GalleryItem.collection.updateOne(
        { imageUrl: item.imageUrl },
        { $set: item },
        { upsert: true }
      );
    }

    console.log("Gallery seed completed successfully.");
  } catch (error) {
    console.error("Gallery seed error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seedGallery();