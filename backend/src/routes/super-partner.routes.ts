import { Router } from "express";
import {
  createSuperPartner,
  getSuperPartners,
  reorderSuperPartners,
  setSuperPartnerActive,
  updateSuperPartner,
} from "../controllers/super-partner.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("SUPER_ADMIN"));

router.get("/", getSuperPartners);
router.post("/", createSuperPartner);

router.patch("/reorder", reorderSuperPartners);

router.patch("/:partnerId", updateSuperPartner);
router.patch("/:partnerId/status", setSuperPartnerActive);

export default router;