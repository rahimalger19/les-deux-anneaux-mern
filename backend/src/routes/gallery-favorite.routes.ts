import { Router } from "express";
import {
  addMyGalleryFavorite,
  getMyGalleryFavorites,
  removeMyGalleryFavorite,
} from "../controllers/gallery-favorite.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, getMyGalleryFavorites);
router.post("/:itemId", requireAuth, addMyGalleryFavorite);
router.delete("/:favoriteId", requireAuth, removeMyGalleryFavorite);

export default router;