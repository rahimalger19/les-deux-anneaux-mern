import { Router } from "express";
import {
  downloadGuestInvoice,
  downloadGuestProForma,
  downloadMyInvoice,
  downloadMyProForma,
  getMyDocuments,
  downloadPublicProForma,
} from "../controllers/document.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/tracking/:token/proforma", downloadGuestProForma);
router.get("/tracking/:token/invoice", downloadGuestInvoice);

router.get("/proforma/:token", downloadPublicProForma);

router.get("/my", requireAuth, getMyDocuments);
router.get("/my/:bookingId/proforma", requireAuth, downloadMyProForma);
router.get("/my/:bookingId/invoice", requireAuth, downloadMyInvoice);

export default router;