import { Router } from "express";
import {
  getSuperCurrencies,
  saveSuperCurrencyRate,
  saveSuperDiasporaCountry,
} from "../controllers/super-currency.controller";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("SUPER_ADMIN"));

router.get("/", getSuperCurrencies);

router.post("/countries", saveSuperDiasporaCountry);
router.put("/countries/:code", saveSuperDiasporaCountry);

router.put("/:currency", saveSuperCurrencyRate);

export default router;