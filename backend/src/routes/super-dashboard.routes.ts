import { Router } from "express";
import { getSuperDashboard } from "../controllers/super-dashboard.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("SUPER_ADMIN"));

router.get("/", getSuperDashboard);

export default router;