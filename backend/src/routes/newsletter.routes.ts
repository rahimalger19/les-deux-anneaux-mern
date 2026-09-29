import { Router } from "express";
import {
  confirmNewsletter,
  subscribeNewsletter,
  unsubscribeNewsletter,
} from "../controllers/newsletter.controller";

const router = Router();

router.post("/", subscribeNewsletter);
router.post("/confirm", confirmNewsletter);
router.post("/unsubscribe", unsubscribeNewsletter);

export default router;