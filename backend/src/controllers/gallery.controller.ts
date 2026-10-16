import crypto from "crypto";
import mongoose from "mongoose";
import type { Request, Response } from "express";
import { GalleryItem } from "../models/GalleryItem";
import { GalleryLike } from "../models/GalleryLike";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getVisitorHash(req: Request, visitorId: string) {
  const secret = process.env.GALLERY_LIKE_SECRET?.trim();

  if (!secret) {
    throw new Error("GALLERY_LIKE_SECRET is missing");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${visitorId}:${req.ip}`)
    .digest("hex");
}

export async function getGalleryItems(req: Request, res: Response) {
  try {
    const eventType = String(req.query.eventType || "").trim();
    const album = String(req.query.album || "").trim();

    const filter: Record<string, unknown> = {
  active: true,
  imageRightsConfirmed: true,
};

    if (eventType) {
      filter.eventTypeKey = eventType;
    }

    if (album) {
      filter.album = album;
    }

    const items = await GalleryItem.find(filter)
      .select(
        "album eventTypeKey title imageUrl likeCount sortOrder createdAt"
      )
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      items: items.map((item: any) => ({
        _id: item._id.toString(),
        album: item.album,
        eventTypeKey: item.eventTypeKey,
        title: item.title,
        imageUrl: item.imageUrl,
        likeCount: item.likeCount || 0,
        sortOrder: item.sortOrder || 0,
        createdAt: item.createdAt,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load gallery",
    });
  }
}

export async function getGalleryAlbums(req: Request, res: Response) {
  try {
    const eventType = String(req.query.eventType || "").trim();

    const match: Record<string, unknown> = {
  active: true,
  imageRightsConfirmed: true,
};
    if (eventType) {
      match.eventTypeKey = eventType;
    }

    const albums = await GalleryItem.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            album: "$album",
            eventTypeKey: "$eventTypeKey",
          },
          imageCount: { $sum: 1 },
          sortOrder: { $min: "$sortOrder" },
        },
      },
      {
        $project: {
          _id: 0,
          album: "$_id.album",
          eventTypeKey: "$_id.eventTypeKey",
          imageCount: 1,
          sortOrder: 1,
        },
      },
      {
        $sort: {
          eventTypeKey: 1,
          sortOrder: 1,
          album: 1,
        },
      },
    ]);

    return res.json({
      success: true,
      albums,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load gallery albums",
    });
  }
}

export async function likeGalleryItem(req: Request, res: Response) {
  try {
    const itemId = getParam(req.params.itemId);
    const visitorId = String(req.body.visitorId || "").trim();

    if (
      !itemId ||
      !mongoose.isValidObjectId(itemId) ||
      !/^[a-zA-Z0-9-]{16,128}$/.test(visitorId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid visitor identifier is required",
      });
    }

    const item = await GalleryItem.findOne({
      _id: itemId,
      active: true,
    }).select("likeCount");

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    const visitorHash = getVisitorHash(req, visitorId);

    try {
      await GalleryLike.create({
        galleryItemId: item._id,
        visitorHash,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
  await GalleryLike.deleteOne({
    galleryItemId: item._id,
    visitorHash,
  });

  const updatedItem = await GalleryItem.findOneAndUpdate(
    {
      _id: item._id,
      active: true,
      likeCount: { $gt: 0 },
    },
    {
      $inc: { likeCount: -1 },
    },
    {
      returnDocument: "after",
    }
  ).select("likeCount");

  const currentItem =
    updatedItem ||
    (await GalleryItem.findById(item._id).select("likeCount"));

  return res.json({
    success: true,
    liked: false,
    likeCount: currentItem?.likeCount || 0,
  });
}

      throw error;
    }

    const updatedItem = await GalleryItem.findOneAndUpdate(
      { _id: item._id, active: true },
      { $inc: { likeCount: 1 } },
      { returnDocument: "after" }
    ).select("likeCount");

    if (!updatedItem) {
      await GalleryLike.deleteOne({
        galleryItemId: item._id,
        visitorHash,
      });

      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    return res.json({
      success: true,
      liked: true,
      likeCount: updatedItem.likeCount,
    });
  } catch (error) {
    console.error("Like gallery item error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to like gallery item",
    });
  }
}