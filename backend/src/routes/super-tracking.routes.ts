import { Router } from "express";
import { getSuperTracking } from "../controllers/super-tracking.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("SUPER_ADMIN"));

router.get("/", getSuperTracking);

export default router;