import type { Request, Response } from "express";
import { Booking } from "../models/Booking";
import { LocalPayer } from "../models/LocalPayer";
import { PAYMENT_METHODS, type PaymentMethod } from "../models/Payment";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getMyLocalPayers(req: Request, res: Response) {
  try {
    const payers = await LocalPayer.find({
      clientUserId: req.user?.id,
      active: true,
    })
      .populate("bookingId", "eventDate eventTypeKey pricingMarket")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, payers });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load local payers",
    });
  }
}

export async function createMyLocalPayer(req: Request, res: Response) {
  try {
    const {
      bookingId,
      name,
      phone,
      relationship,
      paymentMethod,
    } = req.body;

    if (
      !req.user ||
      !bookingId ||
      !name ||
      !phone ||
      !relationship ||
      !paymentMethod
    ) {
      return res.status(400).json({
        success: false,
        message: "All payer information is required",
      });
    }

    if (!PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user.id,
      pricingMarket: "DIASPORA",
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        message: "A local payer is available only for your diaspora bookings",
      });
    }

    const payer = await LocalPayer.create({
      clientUserId: req.user.id,
      bookingId: booking._id,
      name: String(name).trim(),
      phone: String(phone).trim(),
      relationship: String(relationship).trim(),
      paymentMethod,
      active: true,
    });

    return res.status(201).json({
      success: true,
      payer,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to create local payer",
    });
  }
}

export async function removeMyLocalPayer(req: Request, res: Response) {
  try {
    const payerId = getParam(req.params.payerId);

    const payer = await LocalPayer.findOneAndUpdate(
      {
        _id: payerId,
        clientUserId: req.user?.id,
      },
      {
        $set: { active: false },
      },
      { returnDocument: "after" }
    );

    if (!payer) {
      return res.status(404).json({
        success: false,
        message: "Local payer not found",
      });
    }

    return res.json({ success: true });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to remove local payer",
    });
  }
}