import { Router } from "express";
import {
  getAdminReviews,
  updateAdminReview,
} from "../controllers/admin-review.controller";
import {
  requireAuth,
  requireRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRoles("RECEPTION", "MANAGER"));

router.get("/", getAdminReviews);
router.patch("/:reviewId", updateAdminReview);

export default router;