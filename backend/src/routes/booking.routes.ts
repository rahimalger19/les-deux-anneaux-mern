import { Router } from "express";
import {
  checkAvailability,
  createGuestDraft,
  estimateBooking,
  getGuestTracking,
  verifyGuestOtp,
  resendGuestOtp,
  getMyBookingDetails,
  getMyBookings,
  saveMyDraft,
} from "../controllers/booking.controller";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/availability", checkAvailability);
router.get("/tracking/:token", getGuestTracking);

router.post("/estimate", estimateBooking);
router.post("/draft", optionalAuth, createGuestDraft);
router.post("/my/drafts", requireAuth, saveMyDraft);

router.post("/:bookingId/verify-otp", verifyGuestOtp);
router.post("/:bookingId/otp/resend", resendGuestOtp);

router.get("/my", requireAuth, getMyBookings);
router.get("/my/:bookingId", requireAuth, getMyBookingDetails);

export default router;