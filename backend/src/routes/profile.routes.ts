import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { profileUpload } from "../middleware/profile-upload.middleware";

const router = Router();

router.get("/me", requireAuth, getMyProfile);

router.patch(
  "/me",
  requireAuth,
  profileUpload.single("photo"),
  updateMyProfile
);

export default router;