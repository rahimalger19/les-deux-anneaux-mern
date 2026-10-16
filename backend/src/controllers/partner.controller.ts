import type { Request, Response } from "express";
import { Partner } from "../models/Partner";

export async function getPartners(_req: Request, res: Response) {
  try {
    const partners = await Partner.find({ active: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    return res.json({
      success: true,
      partners,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load partners",
    });
  }
}

export async function trackPartnerClick(req: Request, res: Response) {
  try {
    const partner = await Partner.findByIdAndUpdate(
      req.params.partnerId,
      { $inc: { clickCount: 1 } },
      { returnDocument: "after" }
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    return res.json({
      success: true,
      websiteUrl: partner.websiteUrl,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to track partner click",
    });
  }
}