import type { Request, Response } from "express";
import { ExchangeRate } from "../models/ExchangeRate";

export async function getPublicExchangeRates(
  _req: Request,
  res: Response
) {
  try {
    const rates = await ExchangeRate.find({ active: true })
      .select("currency dzdPerUnit")
      .sort({ currency: 1 })
      .lean();

    return res.json({
      success: true,
      rates: rates.map((rate) => ({
        currency: rate.currency,
        dzdPerUnit: rate.dzdPerUnit,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load exchange rates",
    });
  }
}