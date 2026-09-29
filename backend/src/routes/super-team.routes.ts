import { Router } from "express";
import {
  createSuperTeamUser,
  getSuperTeam,
  updateSuperTeamUser,
} from "../controllers/super-team.controller";
import {
  requireAuth,
  requireRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRoles("SUPER_ADMIN"));

router.get("/", getSuperTeam);
router.post("/", createSuperTeamUser);
router.patch("/:userId", updateSuperTeamUser);

export default router;