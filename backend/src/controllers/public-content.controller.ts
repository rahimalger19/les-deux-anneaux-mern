import type { Request, Response } from "express";
import { Faq } from "../models/Faq";
import { Service } from "../models/Service";
import { VenueInfo } from "../models/VenueInfo";

export async function getPublicServices(_req: Request, res: Response) {
  try {
    const services = await Service.find({ active: true })
      .sort({ category: 1, key: 1 })
      .lean();

    return res.json({
      success: true,
      services,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load services",
    });
  }
}

export async function getVenueInfo(_req: Request, res: Response) {
  try {
    const venue = await VenueInfo.findOne({ published: true }).lean();

    return res.json({
      success: true,
      venue,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load venue information",
    });
  }
}

export async function getPublicFaqs(_req: Request, res: Response) {
  try {
    const faqs = await Faq.find({ active: true }).sort({ key: 1 }).lean();

    return res.json({
      success: true,
      faqs,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load FAQ",
    });
  }
}