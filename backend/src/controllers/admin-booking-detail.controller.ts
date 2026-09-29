import type { Request, Response } from "express";
import { AvailabilityBlock } from "../models/AvailabilityBlock";
import {
  Booking,
  type BookingSlot,
  type BookingStatus,
} from "../models/Booking";
import { EventType } from "../models/EventType";
import { ProForma } from "../models/ProForma";
import { User } from "../models/User";
import {
  createActiveSlotKey,
  expireBookingHolds,
} from "../services/booking.service";
import { sendProFormaEmail } from "../services/mail.service";
import mongoose from "mongoose";
import { AuditLog } from "../models/AuditLog";
import {
  createProFormaEmailLink,
  createProFormaForBooking,
} from "../services/proforma.service";

const activeStatuses: BookingStatus[] = [
  "HELD",
  "PROOF_PENDING",
  "PAID",
  "INVOICED",
  "DONE",
];

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function hasBodyField(body: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function isBookingSlot(value: string): value is BookingSlot {
  return ["AFTERNOON", "EVENING", "NIGHT", "DAY"].includes(value);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getBackendUrl() {
  const url = process.env.BACKEND_URL?.trim();

  if (!url) {
    throw new Error("BACKEND_URL is missing in backend/.env");
  }

  return url.replace(/\/$/, "");
}

export async function getAdminBookingDetails(
  req: Request,
  res: Response
) {
  try {
    const bookingId = getParam(req.params.bookingId);

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate("userId", "name email phone")
      .populate("assignedAgent", "name email role")
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const proForma = await ProForma.findOne({
      bookingId: booking._id,
    }).lean();

    const data = booking as any;

    return res.json({
      success: true,
      booking: {
        id: data._id.toString(),
        source: data.source || "ONLINE",
        eventDate: data.eventDate,
        slot: data.slot,
        eventTypeKey: data.eventTypeKey,
        packKey: data.packKey,
        optionKeys: data.optionKeys || [],
        womenGuests: data.womenGuests,
        menGuests: data.menGuests,
        pricingMarket: data.pricingMarket,
        currency: data.currency,
        totalDZD: data.totalDZD,
        depositDZD: data.depositDZD,
        status: data.status,
        holdExpiresAt: data.holdExpiresAt,
        guestPhone: data.guestPhone,
        adminNotes: data.adminNotes || "",
        priceOverrideDZD: data.priceOverrideDZD,
        priceOverrideReason: data.priceOverrideReason || "",
        client: data.userId
          ? {
              id: data.userId._id.toString(),
              name: data.userId.name,
              email: data.userId.email,
              phone: data.userId.phone,
            }
          : null,
        assignedAgent: data.assignedAgent
          ? {
              id: data.assignedAgent._id.toString(),
              name: data.assignedAgent.name,
              email: data.assignedAgent.email,
              role: data.assignedAgent.role,
            }
          : null,
        proForma: proForma
          ? {
              number: proForma.proFormaNumber,
              issuedAt: proForma.issuedAt,
              totalDZD: proForma.totalDZD,
              depositDZD: proForma.depositDZD,
            }
          : null,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load booking dossier",
    });
  }
}

export async function updateAdminBooking(req: Request, res: Response) {
  try {
    const bookingId = getParam(req.params.bookingId);

    if (!bookingId || !mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "A valid booking ID is required",
      });
    }

    const body = req.body as Record<string, unknown>;
    const allowedFields = [
      "assignedAgentId",
      "adminNotes",
      "slot",
      "priceOverrideDZD",
      "priceOverrideReason",
    ];

    if (!allowedFields.some((field) => hasBodyField(body, field))) {
      return res.status(400).json({
        success: false,
        message: "No valid booking update was supplied",
      });
    }

    await expireBookingHolds();

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const changesPrice =
      hasBodyField(body, "priceOverrideDZD") ||
      hasBodyField(body, "priceOverrideReason");

    const newSlot = String(body.slot || "");
    const changesSlot =
      hasBodyField(body, "slot") && newSlot !== booking.slot;

    const existingProForma = await ProForma.findOne({
      bookingId: booking._id,
    }).select("_id");

    if (existingProForma && (changesPrice || changesSlot)) {
      return res.status(409).json({
        success: false,
        message:
          "Price and slot cannot be changed after a pro forma has been issued",
      });
    }

    const auditMetadata: Record<string, unknown> = {
      updatedFields: [] as string[],
    };

    const updatedFields = auditMetadata.updatedFields as string[];

    if (hasBodyField(body, "adminNotes")) {
      const notes = String(body.adminNotes || "").trim();

      if (notes.length > 3000) {
        return res.status(400).json({
          success: false,
          message: "Internal notes cannot exceed 3000 characters",
        });
      }

      booking.adminNotes = notes;
      updatedFields.push("adminNotes");
      auditMetadata.adminNotesLength = notes.length;
    }

    if (hasBodyField(body, "assignedAgentId")) {
      const assignedAgentId = String(body.assignedAgentId || "").trim();

      if (!assignedAgentId) {
        booking.assignedAgent = undefined;
        auditMetadata.assignedAgentId = null;
      } else {
        if (!mongoose.isValidObjectId(assignedAgentId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid assigned agent",
          });
        }

        const agent = await User.findOne({
          _id: assignedAgentId,
          role: { $in: ["RECEPTION", "MANAGER"] },
        }).select("_id");

        if (!agent) {
          return res.status(400).json({
            success: false,
            message: "Assigned agent must be reception or manager",
          });
        }

        booking.assignedAgent = agent._id;
        auditMetadata.assignedAgentId = agent._id.toString();
      }

      updatedFields.push("assignedAgent");
    }

    let eventType:
      | {
          allowedSlots: BookingSlot[];
          depositPercent: number;
          diasporaDepositPercent?: number;
        }
      | null = null;

    if (changesPrice || changesSlot) {
      eventType = await EventType.findOne({
        key: booking.eventTypeKey,
      })
        .select("allowedSlots depositPercent diasporaDepositPercent")
        .lean();

      if (!eventType) {
        return res.status(400).json({
          success: false,
          message: "Event type not found",
        });
      }
    }

    if (changesPrice) {
      const amount = Number(body.priceOverrideDZD);
      const reason = String(body.priceOverrideReason || "").trim();

      if (
        !Number.isFinite(amount) ||
        amount < 0 ||
        !reason ||
        reason.length > 1000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid override amount and a mandatory reason are required",
        });
      }

      if (booking.status !== "HELD") {
        return res.status(409).json({
          success: false,
          message:
            "Price can only be overridden while the reservation is held and before payment proof submission",
        });
      }

      const depositPercent =
        booking.pricingMarket === "DIASPORA"
          ? eventType?.diasporaDepositPercent ??
            eventType?.depositPercent
          : eventType?.depositPercent;

      if (depositPercent === undefined) {
        return res.status(400).json({
          success: false,
          message: "Deposit percentage is not configured",
        });
      }

      booking.priceOverrideDZD = Math.round(amount);
      booking.priceOverrideReason = reason;
      booking.totalDZD = Math.round(amount);
      booking.depositDZD = Math.round(
        booking.totalDZD * (depositPercent / 100)
      );

      updatedFields.push("priceOverride");
      auditMetadata.priceOverrideDZD = booking.priceOverrideDZD;
      auditMetadata.depositDZD = booking.depositDZD;
    }

    if (changesSlot) {
      if (!isBookingSlot(newSlot)) {
        return res.status(400).json({
          success: false,
          message: "Invalid slot",
        });
      }

      if (!eventType?.allowedSlots.includes(newSlot)) {
        return res.status(400).json({
          success: false,
          message: "This event type is not available during that slot",
        });
      }

      if (booking.status !== "HELD") {
        return res.status(409).json({
          success: false,
          message:
            "The slot can only be changed while the reservation is held",
        });
      }

      if (
        !booking.holdExpiresAt ||
        booking.holdExpiresAt.getTime() <= Date.now()
      ) {
        booking.status = "EXPIRED";
        booking.activeSlotKey = undefined;
        booking.holdExpiresAt = undefined;
        await booking.save();

        return res.status(409).json({
          success: false,
          message: "Booking hold has expired",
        });
      }

      const [otherBooking, block] = await Promise.all([
        Booking.findOne({
          _id: { $ne: booking._id },
          spaceKey: booking.spaceKey,
          eventDate: booking.eventDate,
          slot: newSlot,
          status: { $in: activeStatuses },
        })
          .select("_id")
          .lean(),

        AvailabilityBlock.findOne({
          spaceKey: booking.spaceKey,
          eventDate: booking.eventDate,
          slots: newSlot,
          active: true,
        })
          .select("_id")
          .lean(),
      ]);

      if (otherBooking || block) {
        return res.status(409).json({
          success: false,
          message: "The selected slot is not available",
        });
      }

      booking.slot = newSlot;
      booking.activeSlotKey = createActiveSlotKey(
        booking.spaceKey,
        booking.eventDate,
        newSlot
      );

      updatedFields.push("slot");
      auditMetadata.slot = newSlot;
    }

    try {
      await booking.save();
    } catch (error: any) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "The selected slot is no longer available",
        });
      }

      throw error;
    }

    await AuditLog.create({
      actorId: req.user?.id,
      action: "ADMIN_BOOKING_UPDATED",
      entityType: "Booking",
      entityId: booking._id.toString(),
      metadata: auditMetadata,
    });

    return res.json({
      success: true,
      message: "Booking dossier updated",
    });
  } catch (error) {
    console.error("Update booking dossier error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update booking dossier",
    });
  }
}

export async function sendAdminProForma(
  req: Request,
  res: Response
) {
  try {
    const bookingId = getParam(req.params.bookingId);
    const recipientEmail = String(req.body.recipientEmail || "")
      .trim()
      .toLowerCase();

    if (
      !bookingId ||
      !mongoose.isValidObjectId(bookingId) ||
      !isEmail(recipientEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid booking ID and recipient email are required",
      });
    }

    await expireBookingHolds();

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const proForma = await createProFormaForBooking(
      booking._id.toString(),
      req.user?.id
    );

    const delivery = await createProFormaEmailLink(
      proForma._id.toString(),
      recipientEmail
    );

    const downloadUrl =
      `${getBackendUrl()}/api/documents/proforma/${delivery.token}`;

    await sendProFormaEmail(
      recipientEmail,
      proForma.proFormaNumber,
      downloadUrl
    );

    await AuditLog.create({
      actorId: req.user?.id,
      action: "PROFORMA_SENT",
      entityType: "ProForma",
      entityId: proForma._id.toString(),
      metadata: {
        bookingId: booking._id.toString(),
        proFormaNumber: proForma.proFormaNumber,
        recipientDomain: recipientEmail.split("@")[1] || "",
        linkExpiresAt: delivery.expiresAt,
      },
    });

    return res.json({
      success: true,
      message: "Pro forma sent",
      proFormaNumber: proForma.proFormaNumber,
    });
  } catch (error: any) {
    console.error("Send pro forma error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to send pro forma",
    });
  }
}