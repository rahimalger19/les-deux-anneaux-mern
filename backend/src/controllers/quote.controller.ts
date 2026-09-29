import type { Request, Response } from "express";
import { BOOKING_SLOTS, type BookingSlot } from "../models/Booking";
import { Quote } from "../models/Quote";
import { calculateBookingEstimate } from "../services/pricing.service";

export async function createQuote(req: Request, res: Response) {
  try {
    const {
      eventTypeKey,
      packKey,
      slot,
      womenGuests,
      menGuests,
      customRequest,
      pricingMarket,
    } = req.body;

    const women = Number(womenGuests);
    const men = Number(menGuests);

    if (!req.user || !eventTypeKey || !packKey || !slot || !pricingMarket) {
      return res.status(400).json({
        success: false,
        message: "Missing quote information",
      });
    }

    if (
      !BOOKING_SLOTS.includes(slot as BookingSlot) ||
      !Number.isInteger(women) ||
      !Number.isInteger(men) ||
      women < 0 ||
      men < 0 ||
      women + men < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid quote information",
      });
    }

    const estimate = await calculateBookingEstimate({
      eventTypeKey,
      packKey,
      slot: slot as BookingSlot,
      womenGuests: women,
      menGuests: men,
      pricingMarket,
    });

    const cleanCustomRequest = String(customRequest || "").trim();

    const quote = await Quote.create({
      userId: req.user.id,
      eventTypeKey,
      packKey,
      slot,
      pricingMarket,
      womenGuests: women,
      menGuests: men,
      totalDZD: estimate.pricing.totalDZD,
      depositDZD: estimate.pricing.depositDZD,
      status: cleanCustomRequest
        ? "OVERRIDE_REQUESTED"
        : "DRAFT",
      customRequest: cleanCustomRequest || undefined,
    });

    return res.status(201).json({
      success: true,
      quote: {
        id: quote._id,
        ...quote.toObject(),
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to save quote",
    });
  }
}

export async function getMyQuotes(req: Request, res: Response) {
  try {
    const quotes = await Quote.find({
      userId: req.user?.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      quotes: quotes.map((quote) => ({
        id: quote._id,
        ...quote,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load quotes",
    });
  }
}