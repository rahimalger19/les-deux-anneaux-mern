import { Router } from "express";
import {
  getMyGuestList,
  importMyGuestList,
} from "../controllers/guest-list.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { guestListUpload } from "../middleware/guest-list-upload.middleware";

const router = Router();

router.get(
  "/my/:bookingId",
  requireAuth,
  getMyGuestList
);

router.post(
  "/my/:bookingId/import",
  requireAuth,
  guestListUpload.single("file"),
  importMyGuestList
);

export default router;