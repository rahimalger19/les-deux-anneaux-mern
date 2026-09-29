import { Router } from "express";
import {
  getDayOfBookings,
  getDayOfPlan,
  saveDayOfPlan,
} from "../controllers/admin-day-of.controller";
import {
  requireAuth,
  requireRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRoles("RECEPTION", "MANAGER"));

router.get("/", getDayOfBookings);
router.get("/:bookingId", getDayOfPlan);
router.put("/:bookingId", saveDayOfPlan);

export default router;