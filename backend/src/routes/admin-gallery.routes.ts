import { Router } from "express";
import {
  createAdminGalleryItems,
  getAdminGalleryItems,
  removeAdminGalleryItem,
  reorderAdminGalleryItems,
  updateAdminGalleryItem,
} from "../controllers/admin-gallery.controller";
import {
  requireAuth,
  requireRoles,
} from "../middleware/auth.middleware";
import { galleryUpload } from "../middleware/gallery-upload.middleware";

const router = Router();

router.use(requireAuth, requireRoles("RECEPTION", "MANAGER"));

router.get("/", getAdminGalleryItems);

router.post(
  "/",
  galleryUpload.array("images", 12),
  createAdminGalleryItems
);

router.patch("/order", reorderAdminGalleryItems);
router.patch("/:itemId", updateAdminGalleryItem);
router.delete("/:itemId", removeAdminGalleryItem);

export default router;