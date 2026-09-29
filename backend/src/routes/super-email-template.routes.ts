import { Router } from "express";
import {
  getSuperEmailTemplates,
  testSuperSmtp,
  updateSuperEmailTemplate,
} from "../controllers/super-email-template.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("SUPER_ADMIN"));

router.get("/", getSuperEmailTemplates);
router.put("/:key", updateSuperEmailTemplate);
router.post("/test", testSuperSmtp);

export default router;