import mongoose from "mongoose";
import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { Review } from "../models/Review";

const REVIEW_STATUSES = ["PENDING", "PUBLISHED", "HIDDEN"] as const;

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function hasBodyField(body: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

export async function getAdminReviews(req: Request, res: Response) {
  try {
    const status = String(req.query.status || "");

    const filter: Record<string, unknown> = {};

    if (REVIEW_STATUSES.includes(status as any)) {
      filter.status = status;
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({
      success: true,
      reviews: reviews.map((review: any) => ({
        id: review._id.toString(),
        authorName: review.authorName,
        rating: review.rating,
        message: review.message,
        photoUrls: review.photoUrls || [],
        verified: review.verified,
        status: review.status,
        officialReply: review.officialReply || "",
        likeCount: review.likeCount || 0,
        commentCount: review.comments?.length || 0,
        createdAt: review.createdAt,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load reviews",
    });
  }
}

export async function updateAdminReview(req: Request, res: Response) {
  try {
    const reviewId = getParam(req.params.reviewId);

    if (!reviewId || !mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Valid review ID is required",
      });
    }

    const body = req.body as Record<string, unknown>;
    const set: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};
    const changes: Record<string, unknown> = {};

    if (hasBodyField(body, "status")) {
      const status = String(body.status || "");

      if (!REVIEW_STATUSES.includes(status as any)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review status",
        });
      }

      set.status = status;
      changes.status = status;
    }

    if (hasBodyField(body, "officialReply")) {
      const officialReply = String(body.officialReply || "").trim();

      if (officialReply.length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Official reply cannot exceed 2000 characters",
        });
      }

      if (officialReply) {
        set.officialReply = officialReply;
        set.officialReplyBy = req.user?.id;
        set.officialRepliedAt = new Date();
        changes.officialReplyUpdated = true;
        changes.officialReplyLength = officialReply.length;
      } else {
        unset.officialReply = 1;
        unset.officialReplyBy = 1;
        unset.officialRepliedAt = 1;
        changes.officialReplyUpdated = false;
      }
    }

    if (Object.keys(set).length === 0 && Object.keys(unset).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid update was supplied",
      });
    }

    const update: Record<string, unknown> = {};

    if (Object.keys(set).length > 0) {
      update.$set = set;
    }

    if (Object.keys(unset).length > 0) {
      update.$unset = unset;
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      update,
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    await AuditLog.create({
      actorId: req.user?.id,
      action: "REVIEW_MODERATED",
      entityType: "Review",
      entityId: review._id.toString(),
      metadata: changes,
    });

    return res.json({
      success: true,
      message: "Review updated",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update review",
    });
  }
}