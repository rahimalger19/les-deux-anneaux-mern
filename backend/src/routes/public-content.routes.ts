import { Router } from "express";
import {
  getPublicFaqs,
  getPublicServices,
  getVenueInfo,
} from "../controllers/public-content.controller";
import { getPublicLegalDocument } from "../controllers/legal.controller";

const router = Router();

router.get("/services", getPublicServices);
router.get("/venue", getVenueInfo);
router.get("/faq", getPublicFaqs);
router.get("/legal/:key", getPublicLegalDocument);

export default router;