import { Router } from "express";
import { getPublicLegalDocument } from "../controllers/legal.controller";

const router = Router();

router.get("/:key", getPublicLegalDocument);

export default router;