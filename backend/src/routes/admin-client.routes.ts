import { Router } from "express";
import {
  getAdminClientDetails,
  getAdminClients,
} from "../controllers/admin-client.controller";
import {
  requireAuth,
  requireRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRoles("RECEPTION", "MANAGER"));

router.get("/", getAdminClients);
router.get("/:kind/:id", getAdminClientDetails);

export default router;