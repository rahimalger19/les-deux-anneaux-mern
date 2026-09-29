import { Router } from "express";
import { getAdminDashboard } from "../controllers/admin-dashboard.controller";
import {
  requireAuth,
  requireRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRoles("RECEPTION", "MANAGER"),
  getAdminDashboard
);

export default router;