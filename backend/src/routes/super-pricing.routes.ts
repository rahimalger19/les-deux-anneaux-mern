import { Router } from "express";
import {
  createPricingRule,
  createPricingSeason,
  deletePricingRule,
  deletePricingSeason,
  getSuperPricing,
  updateEventTypeCapacity,
  updatePricingRule,
  updatePricingSeason,
} from "../controllers/super-pricing.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("SUPER_ADMIN"));

router.get("/", getSuperPricing);

router.post("/rules", createPricingRule);
router.patch("/rules/:ruleId", updatePricingRule);
router.delete("/rules/:ruleId", deletePricingRule);

router.post("/seasons", createPricingSeason);
router.patch("/seasons/:seasonId", updatePricingSeason);
router.delete("/seasons/:seasonId", deletePricingSeason);

router.patch("/event-types/:key", updateEventTypeCapacity);

export default router;