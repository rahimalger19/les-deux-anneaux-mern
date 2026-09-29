import type { Request, Response } from "express";
import { EventType } from "../models/EventType";
import { Pack } from "../models/Pack";
import { PricingRule } from "../models/PricingRule";

export async function getEventTypes(_req: Request, res: Response) {
  try {
    const eventTypes = await EventType.find({ active: true }).sort({ key: 1 });

    return res.json({
      success: true,
      eventTypes,
    });
  } catch (error) {
    console.error("Get event types error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load event types",
    });
  }
}

export async function getPacks(_req: Request, res: Response) {
  try {
    const packs = await Pack.find({ active: true }).sort({ basePriceDZD: 1 });

    return res.json({
      success: true,
      packs,
    });
  } catch (error) {
    console.error("Get packs error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load packs",
    });
  }
}

export async function getPricingRules(_req: Request, res: Response) {
  try {
    const pricingRules = await PricingRule.find({ active: true }).sort({
      priceDZD: 1,
    });

    return res.json({
      success: true,
      pricingRules,
    });
  } catch (error) {
    console.error("Get pricing rules error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load pricing rules",
    });
  }
}