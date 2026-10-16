import crypto from "crypto";
import mongoose from "mongoose";
import type { Request, Response } from "express";
import { Booking } from "../models/Booking";
import { Review } from "../models/Review";
import { ReviewLike } from "../models/ReviewLike";
import { User } from "../models/User";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getReviewLikeHash(req: Request, visitorId: string) {
  const secret = process.env.REVIEW_LIKE_SECRET?.trim();

  if (!secret) {
    throw new Error("REVIEW_LIKE_SECRET is missing");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${visitorId}:${req.ip}`)
    .digest("hex");
}

export async function getPublishedReviews(_req: Request, res: Response) {
  try {
    const reviews = await Review.find({
      status: "PUBLISHED",
    })
      .select(
"authorName rating message photoUrls verified officialReply likeCount comments createdAt"      )
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({
      success: true,
      reviews: reviews.map((review: any) => ({
        _id: review._id.toString(),
        authorName: review.authorName,
        rating: review.rating,
        message: review.message,
        photoUrls: review.photoUrls || [],
        verified: review.verified,
        officialReply: review.officialReply || "",
        likeCount: review.likeCount || 0,
        createdAt: review.createdAt,
        comments: review.comments || [],
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load reviews",
    });
  }
}

export async function likeReview(req: Request, res: Response) {
  try {
    const reviewId = getParam(req.params.reviewId);
    const visitorId = String(req.body.visitorId || "").trim();

    if (
      !reviewId ||
      !mongoose.isValidObjectId(reviewId) ||
      !/^[a-zA-Z0-9-]{16,128}$/.test(visitorId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid visitor identifier is required",
      });
    }

    const review = await Review.findOne({
      _id: reviewId,
      status: "PUBLISHED",
    }).select("likeCount");

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const visitorHash = getReviewLikeHash(req, visitorId);

    try {
      await ReviewLike.create({
        reviewId: review._id,
        visitorHash,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        const currentReview = await Review.findById(review._id).select(
          "likeCount"
        );

        return res.json({
          success: true,
          liked: false,
          likeCount: currentReview?.likeCount || 0,
        });
      }

      throw error;
    }

    const updatedReview = await Review.findOneAndUpdate(
      {
        _id: review._id,
        status: "PUBLISHED",
      },
      {
        $inc: { likeCount: 1 },
      },
      {
        returnDocument: "after",
      }
    ).select("likeCount");

    if (!updatedReview) {
      await ReviewLike.deleteOne({
        reviewId: review._id,
        visitorHash,
      });

      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.json({
      success: true,
      liked: true,
      likeCount: updatedReview.likeCount,
    });
  } catch (error) {
    console.error("Like review error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to like review",
    });
  }
}

export async function createReviewComment(
  req: Request,
  res: Response
) {
  try {
    const reviewId = getParam(req.params.reviewId);
    const message = String(req.body.message || "").trim();

    if (
      !req.user ||
      !reviewId ||
      !mongoose.isValidObjectId(reviewId) ||
      message.length < 2 ||
      message.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid comment between 2 and 1000 characters is required",
      });
    }

    const [review, user] = await Promise.all([
      Review.findOne({
        _id: reviewId,
        status: "PUBLISHED",
      }),
      User.findById(req.user.id).select("name"),
    ]);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Published review not found",
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    review.comments.push({
      authorName: user.name,
      message,
      createdAt: new Date(),
    });

    await review.save();

    const comment = review.comments[review.comments.length - 1];

    return res.status(201).json({
      success: true,
      message: "Comment added",
      comment,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to add comment",
    });
  }
}

export async function getMyReviewableBookings(
  req: Request,
  res: Response
) {
  try {
    const bookings = await Booking.find({
      userId: req.user?.id,
      status: "DONE",
    })
      .select("eventDate eventTypeKey")
      .sort({ eventDate: -1 })
      .lean();

    const reviews = await Review.find({
      userId: req.user?.id,
    })
      .select("bookingId")
      .lean();

    const reviewedBookingIds = new Set(
      reviews.map((review) => review.bookingId.toString())
    );

    return res.json({
      success: true,
      bookings: bookings
        .filter(
          (booking) => !reviewedBookingIds.has(booking._id.toString())
        )
        .map((booking) => ({
          id: booking._id.toString(),
          eventDate: booking.eventDate,
          eventTypeKey: booking.eventTypeKey,
        })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load completed bookings",
    });
  }
}

export async function getMyReviews(req: Request, res: Response) {
  try {
    const reviews = await Review.find({
      userId: req.user?.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, reviews });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load your reviews",
    });
  }
}

export async function createMyReview(req: Request, res: Response) {
  try {
    const bookingId = String(req.body.bookingId || "").trim();
    const rating = Number(req.body.rating);
    const message = String(req.body.message || "").trim();

    if (
      !req.user ||
      !mongoose.isValidObjectId(bookingId) ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      message.length < 2 ||
      message.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid completed booking, rating and review are required",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user.id,
      status: "DONE",
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        message: "Only your completed events can receive a review",
      });
    }

    if (await Review.exists({ bookingId: booking._id })) {
      return res.status(409).json({
        success: false,
        message: "A review already exists for this booking",
      });
    }

    const user = await User.findById(req.user.id).select("name");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const files = (req.files || []) as Express.Multer.File[];

    const review = await Review.create({
      userId: req.user.id,
      bookingId: booking._id,
      authorName: user.name,
      rating,
      message,
      photoUrls: files.map((file) => `/uploads/reviews/${file.filename}`),
      verified: true,
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted for moderation",
      review,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to submit review",
    });
  }
}