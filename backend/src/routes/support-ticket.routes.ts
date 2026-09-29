import { Router } from "express";
import {
  createMySupportTicket,
  getMySupportTickets,
} from "../controllers/support-ticket.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/my", requireAuth, getMySupportTickets);
router.post("/my", requireAuth, createMySupportTicket);

export default router;