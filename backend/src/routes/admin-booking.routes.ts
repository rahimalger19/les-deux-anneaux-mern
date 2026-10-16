import { Router } from "express";
import {
  getAdminBookings,
  getAssignableAgents,
  completeAdminBooking,
} from "../controllers/admin-booking.controller";
import {
  getAdminBookingDetails,
  sendAdminProForma,
  updateAdminBooking,
} from "../controllers/admin-booking-detail.controller";
import {
  requireAuth,
  requireRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRoles("RECEPTION", "MANAGER"));

router.get("/", getAdminBookings);
router.get("/agents", getAssignableAgents);

router.get("/:bookingId", getAdminBookingDetails);
router.patch("/:bookingId", updateAdminBooking);
router.post("/:bookingId/proforma/send", sendAdminProForma);
router.patch(
  "/:bookingId/complete",
  requireAuth,
  requireRoles("RECEPTION", "MANAGER"),
  completeAdminBooking
);

export default router;