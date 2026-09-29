import { Router } from "express";
import {
  createAvailabilityBlocks,
  deleteAvailabilityBlock,
  getAdminCalendar,
} from "../controllers/admin-availability.controller";
import {
  requireAuth,
  requireRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRoles("RECEPTION", "MANAGER"));

router.get("/calendar", getAdminCalendar);
router.post("/blocks", createAvailabilityBlocks);
router.delete("/blocks/:blockId", deleteAvailabilityBlock);

export default router;