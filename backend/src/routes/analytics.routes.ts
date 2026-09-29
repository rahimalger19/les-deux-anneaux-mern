import { Router } from "express";
import { createAnalyticsEvent } from "../controllers/analytics.controller";
import { optionalAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/events", optionalAuth, createAnalyticsEvent);

export default router;