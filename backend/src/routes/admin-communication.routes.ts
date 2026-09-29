import { Router } from "express";
import {
  listContactMessages,
  listNewsletterSubscribers,
  replyToContactMessage,
  updateContactMessageStatus,
} from "../controllers/admin-communication.controller";
import {
  requireAuth,
  requireRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRoles("RECEPTION", "MANAGER"));

router.get("/messages", listContactMessages);
router.patch("/messages/:messageId/status", updateContactMessageStatus);
router.post("/messages/:messageId/reply", replyToContactMessage);

router.get("/newsletter-subscribers", listNewsletterSubscribers);

export default router;