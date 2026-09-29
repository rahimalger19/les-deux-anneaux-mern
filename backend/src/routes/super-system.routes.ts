import { Router } from "express";
import {
  createDatabaseBackup,
  createFeatureFlag,
  getSuperSystem,
  updateFeatureFlag,
  updateLegalDocument,
} from "../controllers/super-system.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("SUPER_ADMIN"));

router.get("/", getSuperSystem);

router.post("/flags", createFeatureFlag);
router.patch("/flags/:flagId", updateFeatureFlag);

router.patch("/legal/:key", updateLegalDocument);

router.post("/backups", createDatabaseBackup);

export default router;