import { Router } from "express";
import {
  getMyPreferences,
  updateMyPreferences,
} from "../controllers/preferences.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/me", requireAuth, getMyPreferences);
router.patch("/me", requireAuth, updateMyPreferences);

export default router;