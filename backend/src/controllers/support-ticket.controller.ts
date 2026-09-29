import type { Request, Response } from "express";
import { Booking } from "../models/Booking";
import { SupportTicket } from "../models/SupportTicket";

export async function getMySupportTickets(
  req: Request,
  res: Response
) {
  try {
    const tickets = await SupportTicket.find({
      userId: req.user?.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, tickets });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load support tickets",
    });
  }
}

export async function createMySupportTicket(
  req: Request,
  res: Response
) {
  try {
    const subject = String(req.body.subject || "").trim();
    const message = String(req.body.message || "").trim();
    const bookingId = String(req.body.bookingId || "").trim();

    if (!req.user || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    if (bookingId) {
      const booking = await Booking.exists({
        _id: bookingId,
        userId: req.user.id,
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }
    }

    const ticket = await SupportTicket.create({
      userId: req.user.id,
      bookingId: bookingId || undefined,
      subject,
      message,
      status: "OPEN",
    });

    return res.status(201).json({
      success: true,
      ticket,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to create support ticket",
    });
  }
}