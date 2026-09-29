import { Router } from "express";
import {
  getAdminAppointments,
  updateAdminAppointment,
} from "../controllers/admin-appointment.controller";
import {
  requireAuth,
  requireRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRoles("RECEPTION", "MANAGER"));

router.get("/", getAdminAppointments);
router.patch("/:appointmentId", updateAdminAppointment);

export default router;