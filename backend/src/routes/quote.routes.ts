import { Router } from "express";
import {
  createQuote,
  getMyQuotes,
} from "../controllers/quote.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/my", requireAuth, getMyQuotes);
router.post("/", requireAuth, createQuote);

export default router;