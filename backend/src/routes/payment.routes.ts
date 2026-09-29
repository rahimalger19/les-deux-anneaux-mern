import { Router } from "express";
import {
  createMyPayment,
  getMyPayments,
  getPaymentInstructions,
  listPendingProofPayments,
  rejectPayment,
  uploadMyPaymentProof,
  validatePayment,
  downloadAdminPaymentProof,
} from "../controllers/payment.controller";
import {
  requireAuth,
  requireRoles,
} from "../middleware/auth.middleware";
import { proofUpload } from "../middleware/upload.middleware";

const router = Router();

const paymentAdminRoles = [
  "RECEPTION",
  "MANAGER",
] as const;

router.get("/instructions", getPaymentInstructions);

router.get("/my", requireAuth, getMyPayments);

router.post(
  "/my/:bookingId",
  requireAuth,
  createMyPayment
);

router.post(
  "/my/:bookingId/proof",
  requireAuth,
  proofUpload.single("proof"),
  uploadMyPaymentProof
);

router.get(
  "/admin/pending",
  requireAuth,
  requireRoles(...paymentAdminRoles),
  listPendingProofPayments
);

router.get(
  "/admin/:paymentId/proof",
  requireAuth,
  requireRoles(...paymentAdminRoles),
  downloadAdminPaymentProof
);

router.patch(
  "/admin/:paymentId/validate",
  requireAuth,
  requireRoles(...paymentAdminRoles),
  validatePayment
);

router.patch(
  "/admin/:paymentId/reject",
  requireAuth,
  requireRoles(...paymentAdminRoles),
  rejectPayment
);


export default router;