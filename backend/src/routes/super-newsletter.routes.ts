import { Router } from "express";
import {
  createSuperNewsletterCampaign,
  exportSuperNewsletterSubscribers,
  getSuperNewsletter,
  sendSuperNewsletterCampaign,
} from "../controllers/super-newsletter.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("SUPER_ADMIN"));

router.get("/", getSuperNewsletter);
router.get("/export", exportSuperNewsletterSubscribers);

router.post("/campaigns", createSuperNewsletterCampaign);
router.post(
  "/campaigns/:campaignId/send",
  sendSuperNewsletterCampaign
);

export default router;