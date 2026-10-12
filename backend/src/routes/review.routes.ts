import { Router } from "express";
import {
  createMyReview,
  createReviewComment,
  getMyReviewableBookings,
  getMyReviews,
  getPublishedReviews,
  likeReview,
} from "../controllers/review.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { reviewUpload } from "../middleware/review-upload.middleware";

const router = Router();

router.get("/", getPublishedReviews);
router.post("/:reviewId/like", likeReview);
router.post(
  "/:reviewId/comments",
  requireAuth,
  createReviewComment
);

router.get("/my/list", requireAuth, getMyReviews);
router.get(
  "/my/eligible-bookings",
  requireAuth,
  getMyReviewableBookings
);

router.post(
  "/my",
  requireAuth,
  reviewUpload.array("photos", 5),
  createMyReview
);

export default router;