import { Router } from "express";
import {
  login,
  logout,
  me,
  register,
  requestPhoneLoginOtp,
  verifyPhoneLoginOtp,
  requestPasswordReset,
  resetPassword,
  verifyTwoFactorLogin,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/login/two-factor/verify", verifyTwoFactorLogin);

router.post("/phone-otp/request", requestPhoneLoginOtp);

router.post("/phone-otp/verify", verifyPhoneLoginOtp);

router.post("/password-reset/request", requestPasswordReset);

router.post("/password-reset/confirm", resetPassword);

router.get("/me", requireAuth, me);

router.post("/logout", logout);

export default router;