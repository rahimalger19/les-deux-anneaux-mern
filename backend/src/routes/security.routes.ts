import { Router } from "express";
import {
  changeMyPassword,
  confirmPhoneChange,
  getMySessions,
  requestPhoneChangeOtp,
  revokeMySession,
  updateMyTwoFactor,
} from "../controllers/security.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/sessions", requireAuth, getMySessions);
router.delete("/sessions/:sessionId", requireAuth, revokeMySession);

router.patch("/password", requireAuth, changeMyPassword);

router.post("/phone/request-otp", requireAuth, requestPhoneChangeOtp);
router.post("/phone/confirm", requireAuth, confirmPhoneChange);
router.patch("/two-factor", requireAuth, updateMyTwoFactor);

export default router;