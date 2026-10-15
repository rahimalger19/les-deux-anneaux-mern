import mongoose from "mongoose";
import { AuditLog } from "../models/AuditLog";
import { EventType } from "../models/EventType";
import type { Request, Response } from "express";
import { GalleryItem } from "../models/GalleryItem";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function hasBodyField(body: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function getBackendUrl() {
  const value = process.env.BACKEND_URL?.trim();

  if (!value) {
    throw new Error("BACKEND_URL is missing in backend/.env");
  }

  return value.replace(/\/$/, "");
}

function toBoolean(value: unknown) {
  return value === true || value === "true";
}

async function ensureEventTypeExists(eventTypeKey: string) {
  const eventType = await EventType.exists({ key: eventTypeKey });

  if (!eventType) {
    throw new Error("Selected event type does not exist");
  }
}

function isValidAlbum(value: string) {
  return value.length >= 2 && value.length <= 120;
}

export async function getAdminGalleryItems(
  _req: Request,
  res: Response
) {
  try {
    const items = await GalleryItem.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      items: items.map((item) => ({
        id: item._id.toString(),
        album: item.album,
        eventTypeKey: item.eventTypeKey,
        title: item.title,
        imageUrl: item.imageUrl,
        likeCount: item.likeCount,
        active: item.active,
        sortOrder: item.sortOrder || 0,
        imageRightsConfirmed: item.imageRightsConfirmed || false,
        createdAt: item.createdAt,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load gallery items",
    });
  }
}

export async function createAdminGalleryItems(
  req: Request,
  res: Response
) {
  try {
    const actorId = req.user?.id;

     if (!actorId) {
       return res.status(401).json({ 
        success: false,
        message: "Authentication required",
       });
       }

    const files = (req.files || []) as Express.Multer.File[];
    const album = String(req.body.album || "").trim();
    const eventTypeKey = String(req.body.eventTypeKey || "").trim();
    const titleFr = String(req.body.titleFr || "").trim();
    const titleAr = String(req.body.titleAr || "").trim();
    const titleEn = String(req.body.titleEn || "").trim();
    const imageRightsConfirmed = toBoolean(
      req.body.imageRightsConfirmed
    );

    if (
      files.length === 0 ||
      !album ||
      !eventTypeKey ||
      !titleFr ||
      !titleAr ||
      !titleEn ||
      !imageRightsConfirmed
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Album, event type, three titles, images and image-right confirmation are required",
      });
    }

    if (!isValidAlbum(album)) {
      return res.status(400).json({
        success: false,
        message: "Album name must contain between 2 and 120 characters",
      });
    }

    await ensureEventTypeExists(eventTypeKey);

    const lastItem = await GalleryItem.findOne()
      .sort({ sortOrder: -1 })
      .select("sortOrder")
      .lean();

    const baseOrder = (lastItem?.sortOrder || 0) + 1;
    const backendUrl = getBackendUrl();

    const createdItems = await GalleryItem.insertMany(
      files.map((file, index) => ({
        album,
        eventTypeKey,
        title: {
          fr: titleFr,
          ar: titleAr,
          en: titleEn,
        },
        imageUrl: `${backendUrl}/uploads/gallery/${file.filename}`,
        likeCount: 0,
        active: true,
        sortOrder: baseOrder + index,
        imageRightsConfirmed: true,
        imageRightsConfirmedAt: new Date(),
        imageRightsConfirmedBy: actorId,
        uploadedBy: actorId,
      }))
    );

    await AuditLog.create({
      actorId,
      action: "GALLERY_IMAGES_UPLOADED",
      entityType: "GalleryItem",
      entityId: createdItems[0]._id.toString(),
      metadata: {
        itemIds: createdItems.map((item) => item._id.toString()),
        count: createdItems.length,
        album,
        eventTypeKey,
        imageRightsConfirmed: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: `${createdItems.length} image(s) added to the gallery`,
    });
  } catch (error: any) {
    console.error("Create gallery items error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to upload gallery images",
    });
  }
}

export async function updateAdminGalleryItem(
  req: Request,
  res: Response
) {
  try {
    const itemId = getParam(req.params.itemId);

    if (!itemId || !mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Valid gallery item ID is required",
      });
    }

    const item = await GalleryItem.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

       const body = req.body as Record<string, unknown>;

    if (hasBodyField(body, "album")) {
      const album = String(body.album || "").trim();

      if (!album) {
        return res.status(400).json({
          success: false,
          message: "Album is required",
        });
      }

      if (!isValidAlbum(album)) {
        return res.status(400).json({
          success: false,
          message: "Album name must contain between 2 and 120 characters",
        });
      }

      item.album = album;
    }

    if (hasBodyField(body, "eventTypeKey")) {
      const eventTypeKey = String(body.eventTypeKey || "").trim();

      if (!eventTypeKey) {
        return res.status(400).json({
          success: false,
          message: "Event type is required",
        });
      }

      await ensureEventTypeExists(eventTypeKey);

      item.eventTypeKey = eventTypeKey;
    }

    if (hasBodyField(body, "titleFr")) {
      const titleFr = String(body.titleFr || "").trim();

      if (!titleFr) {
        return res.status(400).json({
          success: false,
          message: "French title is required",
        });
      }

      item.title.fr = titleFr;
    }

    if (hasBodyField(body, "titleAr")) {
      const titleAr = String(body.titleAr || "").trim();

      if (!titleAr) {
        return res.status(400).json({
          success: false,
          message: "Arabic title is required",
        });
      }

      item.title.ar = titleAr;
    }

    if (hasBodyField(body, "titleEn")) {
      const titleEn = String(body.titleEn || "").trim();

      if (!titleEn) {
        return res.status(400).json({
          success: false,
          message: "English title is required",
        });
      }

      item.title.en = titleEn;
    }

    if (hasBodyField(body, "active")) {
      item.active = toBoolean(body.active);
    }
    
    if (hasBodyField(body, "imageRightsConfirmed")) {
  const imageRightsConfirmed = toBoolean(
    body.imageRightsConfirmed
  );

  item.imageRightsConfirmed = imageRightsConfirmed;

  if (imageRightsConfirmed) {
    item.imageRightsConfirmedAt = new Date();
    item.imageRightsConfirmedBy = req.user?.id as any;
  } else {
    item.imageRightsConfirmedAt = undefined;
    item.imageRightsConfirmedBy = undefined;
  }
}

    if (hasBodyField(body, "sortOrder")) {
      const sortOrder = Number(body.sortOrder);

      if (!Number.isInteger(sortOrder) || sortOrder < 0) {
        return res.status(400).json({
          success: false,
          message: "Sort order must be a non-negative integer",
        });
      }

      item.sortOrder = sortOrder;
    }

    const changes = Object.keys(body).filter((key) =>
      [
        "album",
        "eventTypeKey",
        "titleFr",
        "titleAr",
        "titleEn",
        "active",
        "sortOrder",
        "imageRightsConfirmed",
      ].includes(key)
    );

    await item.save();

    await AuditLog.create({
      actorId: req.user?.id,
      action: "GALLERY_ITEM_UPDATED",
      entityType: "GalleryItem",
      entityId: item._id.toString(),
      metadata: { changes },
    });

    return res.json({
      success: true,
      message: "Gallery item updated",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update gallery item",
    });
  }
}

export async function reorderAdminGalleryItems(
  req: Request,
  res: Response
) {
  try {
    const items: Array<{ id?: unknown; sortOrder?: unknown }> =
     Array.isArray(req.body.items) ? req.body.items : [];

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one gallery item is required",
      });
    }

    for (const item of items) {
      const id = String(item?.id || "");
      const sortOrder = Number(item?.sortOrder);

      if (!id || !Number.isInteger(sortOrder) || sortOrder < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid gallery order",
        });
      }
    }

    const ids = items.map((item) => String(item?.id || ""));
    const sortOrders = items.map((item) => Number(item?.sortOrder));

    if (
      ids.some((id) => !mongoose.isValidObjectId(id)) ||
      new Set(ids).size !== ids.length ||
      new Set(sortOrders).size !== sortOrders.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Gallery item IDs and sort orders must be unique",
      });
    }

    const existingCount = await GalleryItem.countDocuments({
      _id: { $in: ids },
    });

    if (existingCount !== ids.length) {
      return res.status(404).json({
        success: false,
        message: "One or more gallery items were not found",
      });
    }

    await Promise.all(
       items.map((item) => 
        GalleryItem.updateOne(
           { _id: String(item.id) },
            { $set: { sortOrder: Number(item.sortOrder) } } 
          ) ) );

    await AuditLog.create({
      actorId: req.user?.id,
      action: "GALLERY_ORDER_UPDATED",
      entityType: "GalleryItem",
      entityId: "bulk-order",
      metadata: {
        itemIds: ids,
        count: ids.length,
      },
    });

    return res.json({
      success: true,
      message: "Gallery order updated",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update gallery order",
    });
  }
}

export async function removeAdminGalleryItem(
  req: Request,
  res: Response
) {
  try {
    const itemId = getParam(req.params.itemId);

    if (!itemId || !mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Valid gallery item ID is required",
      });
    }

    const item = await GalleryItem.findByIdAndUpdate(
      itemId,
      { $set: { active: false } },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    await AuditLog.create({
      actorId: req.user?.id,
      action: "GALLERY_ITEM_HIDDEN",
      entityType: "GalleryItem",
      entityId: item._id.toString(),
      metadata: { active: false },
    });

    return res.json({
      success: true,
      message: "Gallery item hidden",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to hide gallery item",
    });
  }
}