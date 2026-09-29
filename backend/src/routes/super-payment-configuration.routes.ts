import { Router } from "express";
import {
  getSuperPaymentConfiguration,
  updateSuperPaymentConfiguration,
} from "../controllers/super-payment-configuration.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("SUPER_ADMIN"));

router.get("/", getSuperPaymentConfiguration);
router.put("/", updateSuperPaymentConfiguration);

export default router;