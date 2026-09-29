import { Router } from "express";
import {
  getSuperSmsConfiguration,
  updateSuperSmsConfiguration,
} from "../controllers/super-sms.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("SUPER_ADMIN"));

router.get("/", getSuperSmsConfiguration);
router.put("/", updateSuperSmsConfiguration);

export default router;