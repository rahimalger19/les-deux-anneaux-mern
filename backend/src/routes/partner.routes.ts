import { Router } from "express";
import {
  getPartners,
  trackPartnerClick,
} from "../controllers/partner.controller";

const router = Router();

router.get("/", getPartners);
router.post("/:partnerId/click", trackPartnerClick);

export default router;