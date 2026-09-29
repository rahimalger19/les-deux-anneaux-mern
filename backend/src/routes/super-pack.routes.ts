import { Router } from "express";
import {
  createCustomPackTemplate,
  createSuperPack,
  getSuperPacks,
  setCustomPackTemplateActive,
  setSuperPackActive,
  updateCustomPackTemplate,
  updateSuperPack,
} from "../controllers/super-pack.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("SUPER_ADMIN"));

router.get("/", getSuperPacks);

router.post("/", createSuperPack);
router.patch("/:key", updateSuperPack);
router.patch("/:key/status", setSuperPackActive);

router.post("/templates", createCustomPackTemplate);
router.patch("/templates/:templateId", updateCustomPackTemplate);
router.patch(
  "/templates/:templateId/status",
  setCustomPackTemplateActive
);

export default router;