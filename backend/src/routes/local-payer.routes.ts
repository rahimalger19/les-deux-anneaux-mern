import { Router } from "express";
import {
  createMyLocalPayer,
  getMyLocalPayers,
  removeMyLocalPayer,
} from "../controllers/local-payer.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/my", requireAuth, getMyLocalPayers);
router.post("/my", requireAuth, createMyLocalPayer);
router.delete("/my/:payerId", requireAuth, removeMyLocalPayer);

export default router;