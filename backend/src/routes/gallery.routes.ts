import { Router } from "express";
import {
  getGalleryAlbums,
  getGalleryItems,
  likeGalleryItem,
} from "../controllers/gallery.controller";

const router = Router();

router.get("/", getGalleryItems);
router.get("/albums", getGalleryAlbums);
router.post("/:itemId/like", likeGalleryItem);

export default router;