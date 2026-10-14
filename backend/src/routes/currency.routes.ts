import { Router } from "express";
import { getPublicExchangeRates } from "../controllers/currency.controller";

const router = Router();

router.get("/", getPublicExchangeRates);

export default router;