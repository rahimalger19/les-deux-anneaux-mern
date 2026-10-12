import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { DiasporaCountry } from "../models/DiasporaCountry";
import { EventType } from "../models/EventType";
import { ExchangeRate } from "../models/ExchangeRate";
import { Pack } from "../models/Pack";
import { PricingRule } from "../models/PricingRule";

const supportedCurrencies = ["EUR", "USD"] as const;

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getSuperCurrencies(
  _req: Request,
  res: Response
) {
  try {
    const [rates, countries, pricingRules, packs, eventTypes] =
      await Promise.all([
        ExchangeRate.find().sort({ currency: 1 }).lean(),
        DiasporaCountry.find().sort({ name: 1 }).lean(),
        PricingRule.find({ market: "DIASPORA" })
          .sort({ slot: 1, season: 1, minGuests: 1 })
          .lean(),
        Pack.find()
          .select(
            "key name includedGuests diasporaBasePriceDZD diasporaExtraGuestPriceDZD active"
          )
          .sort({ key: 1 })
          .lean(),
        EventType.find()
          .select("key name diasporaDepositPercent active")
          .sort({ key: 1 })
          .lean(),
      ]);

    return res.json({
      success: true,
      rates: (rates as any[]).map((rate) => ({
        id: rate._id.toString(),
        ...rate,
      })),
      countries: (countries as any[]).map((country) => ({
        id: country._id.toString(),
        ...country,
      })),
      diasporaGrid: {
        pricingRules: (pricingRules as any[]).map((rule) => ({
          id: rule._id.toString(),
          slot: rule.slot,
          season: rule.season,
          minGuests: rule.minGuests,
          maxGuests: rule.maxGuests,
          priceDZD: rule.priceDZD,
          active: rule.active,
        })),
        packs: (packs as any[]).map((pack) => ({
          key: pack.key,
          name: pack.name,
          includedGuests: pack.includedGuests,
          basePriceDZD: pack.diasporaBasePriceDZD,
          extraGuestPriceDZD: pack.diasporaExtraGuestPriceDZD,
          active: pack.active,
        })),
        eventTypes: (eventTypes as any[]).map((eventType) => ({
          key: eventType.key,
          name: eventType.name,
          depositPercent: eventType.diasporaDepositPercent,
          active: eventType.active,
        })),
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load exchange-rate configuration",
    });
  }
}

export async function saveSuperCurrencyRate(
  req: Request,
  res: Response
) {
  try {
    const currency = String(
      getParam(req.params.currency) || ""
    ).toUpperCase();

    const dzdPerUnit = Number(req.body.dzdPerUnit);
    const active = req.body.active;

if (typeof active !== "boolean") {
  return res.status(400).json({
    success: false,
    message: "The active value must be true or false",
  });
}

    if (
      !supportedCurrencies.includes(
        currency as (typeof supportedCurrencies)[number]
      ) ||
      !Number.isFinite(dzdPerUnit) ||
      dzdPerUnit <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid currency rate",
      });
    }

    const exchangeRateModel: any = ExchangeRate;

    const rate = await exchangeRateModel.findOneAndUpdate(
      { currency },
      {
        $set: {
          dzdPerUnit,
          active,
          updatedBy: req.user?.id,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!rate) {
      return res.status(500).json({
        success: false,
        message: "Unable to save exchange rate",
      });
    }

    await AuditLog.create({
      actorId: req.user?.id,
      action: "EXCHANGE_RATE_UPDATED",
      entityType: "ExchangeRate",
      entityId: rate._id.toString(),
      metadata: { currency, dzdPerUnit, active },
    });

    return res.json({ success: true, rate });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to save exchange rate",
    });
  }
}

export async function saveSuperDiasporaCountry(
  req: Request,
  res: Response
) {
  try {
    const code = String(
      getParam(req.params.code) || req.body.code || ""
    )
      .trim()
      .toUpperCase();

    const name = String(req.body.name || "").trim();
    const active =
      typeof req.body.active === "boolean" ? req.body.active : true;

    if (!/^[A-Z]{2}$/.test(code) || !name) {
      return res.status(400).json({
        success: false,
        message:
          "A two-letter ISO country code and country name are required",
      });
    }

    const diasporaCountryModel: any = DiasporaCountry;

    const country = await diasporaCountryModel.findOneAndUpdate(
      { code },
      {
        $set: {
          name,
          active,
          updatedBy: req.user?.id,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!country) {
      return res.status(500).json({
        success: false,
        message: "Unable to save diaspora country",
      });
    }

    await AuditLog.create({
      actorId: req.user?.id,
      action: "DIASPORA_COUNTRY_UPDATED",
      entityType: "DiasporaCountry",
      entityId: country._id.toString(),
      metadata: { code, name, active },
    });

    return res.json({ success: true, country });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to save diaspora country",
    });
  }
}