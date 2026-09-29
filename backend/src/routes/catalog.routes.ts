import { Router } from "express";
import {
  getEventTypes,
  getPacks,
  getPricingRules,
} from "../controllers/catalog.controller";

const router = Router();

router.get("/event-types", getEventTypes);
router.get("/packs", getPacks);
router.get("/pricing", getPricingRules);

export default router;