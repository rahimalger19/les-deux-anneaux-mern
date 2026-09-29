import { Router } from "express";
import {
  cancelMyAppointment,
  createAppointment,
  getMyAppointments,
} from "../controllers/appointment.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/my", requireAuth, getMyAppointments);
router.post("/", requireAuth, createAppointment);
router.patch("/:id/cancel", requireAuth, cancelMyAppointment);

export default router;