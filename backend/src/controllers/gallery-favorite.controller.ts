import type { Request, Response } from "express";
import { GalleryFavorite } from "../models/GalleryFavorite";
import { GalleryItem } from "../models/GalleryItem";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getMyGalleryFavorites(req: Request, res: Response) {
  try {
    const favorites = await GalleryFavorite.find({
      userId: req.user?.id,
    })
      .populate("galleryItemId")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, favorites });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load gallery favourites",
    });
  }
}

export async function addMyGalleryFavorite(req: Request, res: Response) {
  try {
    const galleryItemId = getParam(req.params.itemId);
    const collection =
      String(req.body.collection || "Inspiration").trim() || "Inspiration";

    const item = await GalleryItem.findOne({
      _id: galleryItemId,
      active: true,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    const favorite = await GalleryFavorite.findOneAndUpdate(
      {
        userId: req.user?.id,
        galleryItemId: item._id,
        collection,
      },
      {
        $setOnInsert: {
          userId: req.user?.id,
          galleryItemId: item._id,
          collection,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    return res.status(201).json({ success: true, favorite });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to save gallery favourite",
    });
  }
}

export async function removeMyGalleryFavorite(req: Request, res: Response) {
  try {
    const favoriteId = getParam(req.params.favoriteId);

    const favorite = await GalleryFavorite.findOneAndDelete({
      _id: favoriteId,
      userId: req.user?.id,
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Gallery favourite not found",
      });
    }

    return res.json({ success: true });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to remove gallery favourite",
    });
  }
}