import { Router } from "express";
import {
  createMyThread,
  getMyNotifications,
  getMyThreadMessages,
  getMyThreads,
  markMyNotificationRead,
  sendMyThreadMessage,
} from "../controllers/message.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/threads", requireAuth, getMyThreads);
router.post("/threads", requireAuth, createMyThread);
router.get("/threads/:threadId", requireAuth, getMyThreadMessages);
router.post("/threads/:threadId/messages", requireAuth, sendMyThreadMessage);

router.get("/notifications", requireAuth, getMyNotifications);
router.patch(
  "/notifications/:notificationId/read",
  requireAuth,
  markMyNotificationRead
);

export default router;