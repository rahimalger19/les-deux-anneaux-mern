import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { EventType } from "../models/EventType";
import {
  PRICING_DAY_TYPES,
  PRICING_MARKETS,
  PricingRule,
} from "../models/PricingRule";
import { PricingSeason } from "../models/PricingSeason";

const seasons = ["LOW", "NORMAL", "HIGH"] as const;
const slots = ["AFTERNOON", "EVENING", "NIGHT", "DAY"] as const;

function getId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isMonthDay(value: string) {
  return /^\d{2}-\d{2}$/.test(value);
}

async function audit(
  req: Request,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown>
) {
  await AuditLog.create({
    actorId: req.user?.id,
    action,
    entityType,
    entityId,
    metadata,
  });
}

export async function getSuperPricing(
  _req: Request,
  res: Response
) {
  try {
    const [pricingRules, pricingSeasons, eventTypes] = await Promise.all([
      PricingRule.find().sort({ market: 1, slot: 1, minGuests: 1 }).lean(),
      PricingSeason.find().sort({ priority: -1, createdAt: -1 }).lean(),
      EventType.find()
        .select(
          "key name womenCapacity menCapacity allowedSlots durationHours bufferMinutes"
        )
        .sort({ key: 1 })
        .lean(),
    ]);

    return res.json({
      success: true,
      pricingRules: pricingRules.map((rule) => ({
        id: rule._id,
        ...rule,
      })),
      pricingSeasons: pricingSeasons.map((season) => ({
        id: season._id,
        ...season,
      })),
      eventTypes: eventTypes.map((eventType) => ({
        id: eventType._id,
        ...eventType,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load pricing configuration",
    });
  }
}

export async function createPricingRule(req: Request, res: Response) {
  try {
    const {
      market,
      slot,
      season,
      dayType,
      minGuests,
      maxGuests,
      priceDZD,
    } = req.body;

    const min = Number(minGuests);
    const max = Number(maxGuests);
    const price = Number(priceDZD);

    if (
      !PRICING_MARKETS.includes(market) ||
      !slots.includes(slot) ||
      !seasons.includes(season) ||
      !PRICING_DAY_TYPES.includes(dayType) ||
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 1 ||
      max < min ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pricing rule",
      });
    }

    const rule = await PricingRule.create({
      market,
      slot,
      season,
      dayType,
      minGuests: min,
      maxGuests: max,
      priceDZD: price,
      active: true,
    });

    await audit(req, "PRICING_RULE_CREATED", "PricingRule", rule._id.toString(), {
      market,
      slot,
      season,
      dayType,
      minGuests: min,
      maxGuests: max,
      priceDZD: price,
    });

    return res.status(201).json({ success: true, rule });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to create pricing rule",
    });
  }
}

export async function updatePricingRule(req: Request, res: Response) {
  try {
    const ruleId = getId(req.params.ruleId);

    if (!ruleId || typeof req.body.active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "A valid rule and active value are required",
      });
    }

    const rule = await PricingRule.findByIdAndUpdate(
      ruleId,
      { $set: { active: req.body.active } },
      { new: true }
    );

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Pricing rule not found",
      });
    }

    await audit(req, "PRICING_RULE_UPDATED", "PricingRule", ruleId, {
      active: rule.active,
    });

    return res.json({ success: true, rule });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update pricing rule",
    });
  }
}

export async function deletePricingRule(req: Request, res: Response) {
  try {
    const ruleId = getId(req.params.ruleId);
    const rule = await PricingRule.findByIdAndDelete(ruleId);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Pricing rule not found",
      });
    }

    await audit(req, "PRICING_RULE_DELETED", "PricingRule", rule._id.toString(), {
      market: rule.market,
      slot: rule.slot,
    });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to delete pricing rule",
    });
  }
}

export async function createPricingSeason(req: Request, res: Response) {
  try {
    const rawKey = String(req.body.key || "").toUpperCase();
    const startMonthDay = String(req.body.startMonthDay || "");
    const endMonthDay = String(req.body.endMonthDay || "");
    const priority = Number(req.body.priority || 0);

    if (
      !["LOW", "HIGH"].includes(rawKey) ||
      !isMonthDay(startMonthDay) ||
      !isMonthDay(endMonthDay) ||
      !Number.isInteger(priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid season",
      });
    }
const key = rawKey as "LOW" | "HIGH";
    const season = await PricingSeason.create({
      key,
      startMonthDay,
      endMonthDay,
      priority,
      active: true,
    });

    await audit(
      req,
      "PRICING_SEASON_CREATED",
      "PricingSeason",
      season._id.toString(),
      { key, startMonthDay, endMonthDay, priority }
    );

    return res.status(201).json({ success: true, season });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to create season",
    });
  }
}

export async function updatePricingSeason(req: Request, res: Response) {
  try {
    const seasonId = getId(req.params.seasonId);

    if (!seasonId || typeof req.body.active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "A valid season and active value are required",
      });
    }

    const season = await PricingSeason.findByIdAndUpdate(
      seasonId,
      { $set: { active: req.body.active } },
      { new: true }
    );

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    await audit(req, "PRICING_SEASON_UPDATED", "PricingSeason", seasonId, {
      active: season.active,
    });

    return res.json({ success: true, season });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update season",
    });
  }
}

export async function deletePricingSeason(req: Request, res: Response) {
  try {
    const seasonId = getId(req.params.seasonId);
    const season = await PricingSeason.findByIdAndDelete(seasonId);

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    await audit(
      req,
      "PRICING_SEASON_DELETED",
      "PricingSeason",
      season._id.toString(),
      { key: season.key }
    );

    return res.json({ success: true });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to delete season",
    });
  }
}

export async function updateEventTypeCapacity(req: Request, res: Response) {
  try {
    const key = getId(req.params.key);
    const womenCapacity = Number(req.body.womenCapacity);
    const menCapacity = Number(req.body.menCapacity);
    const bufferMinutes = Number(req.body.bufferMinutes);
    const allowedSlots: string[] = Array.isArray(req.body.allowedSlots)
  ? req.body.allowedSlots.filter(
      (slot: unknown): slot is string =>
        typeof slot === "string" &&
        slots.includes(slot as (typeof slots)[number])
    )
  : [];

    if (
      !key ||
      !Number.isInteger(womenCapacity) ||
      !Number.isInteger(menCapacity) ||
      womenCapacity < 0 ||
      menCapacity < 0 ||
      !Number.isInteger(bufferMinutes) ||
      bufferMinutes < 0 ||
      bufferMinutes > 1440 ||
      allowedSlots.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid event capacity configuration",
      });
    }

    const eventType = await EventType.findOneAndUpdate(
      { key },
      {
        $set: {
          womenCapacity,
          menCapacity,
          bufferMinutes,
          allowedSlots,
        },
      },
      { new: true }
    );

    if (!eventType) {
      return res.status(404).json({
        success: false,
        message: "Event type not found",
      });
    }

    await audit(req, "EVENT_CAPACITY_UPDATED", "EventType", eventType._id.toString(), {
      womenCapacity,
      menCapacity,
      bufferMinutes,
      allowedSlots,
    });

    return res.json({ success: true, eventType });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update event configuration",
    });
  }
}