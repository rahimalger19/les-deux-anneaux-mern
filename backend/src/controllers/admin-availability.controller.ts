import mongoose from "mongoose";
import type { Request, Response } from "express";
import { AvailabilityBlock } from "../models/AvailabilityBlock";
import {
  Booking,
  BOOKING_SLOTS,
  type BookingSlot,
  type BookingStatus,
} from "../models/Booking";

const activeStatuses: BookingStatus[] = [
  "HELD",
  "PROOF_PENDING",
  "PAID",
  "INVOICED",
  "DONE",
];

const blockTypes = [
  "MAINTENANCE",
  "MANUAL",
  "PREPARATION_BUFFER",
] as const;

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T12:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function isValidSlot(value: string): value is BookingSlot {
  return BOOKING_SLOTS.includes(value as BookingSlot);
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function daysBetween(from: string, to: string) {
  const fromDate = new Date(`${from}T12:00:00.000Z`);
  const toDate = new Date(`${to}T12:00:00.000Z`);

  return Math.round(
    (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)
  );
}

export async function getAdminCalendar(req: Request, res: Response) {
  try {
    const from = String(req.query.from || "");
    const to = String(req.query.to || "");
    const spaceKey = String(req.query.space || "main-hall").trim();

    if (
      !isValidDate(from) ||
      !isValidDate(to) ||
      from > to ||
      daysBetween(from, to) > 62
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Use valid YYYY-MM-DD dates with a maximum calendar range of 63 days",
      });
    }

    const [bookings, blocks] = await Promise.all([
      Booking.find({
        spaceKey,
        eventDate: { $gte: from, $lte: to },
        status: { $in: activeStatuses },
      })
        .select(
          "eventDate slot eventTypeKey status womenGuests menGuests holdExpiresAt"
        )
        .sort({ eventDate: 1, slot: 1 })
        .lean(),

      AvailabilityBlock.find({
        spaceKey,
        eventDate: { $gte: from, $lte: to },
        active: true,
      })
        .sort({ eventDate: 1, createdAt: 1 })
        .lean(),
    ]);

    return res.json({
      success: true,
      bookings: bookings.map((booking) => ({
        id: booking._id.toString(),
        eventDate: booking.eventDate,
        slot: booking.slot,
        eventTypeKey: booking.eventTypeKey,
        status: booking.status,
        womenGuests: booking.womenGuests,
        menGuests: booking.menGuests,
        holdExpiresAt: booking.holdExpiresAt,
      })),
      blocks: blocks.map((block) => ({
        id: block._id.toString(),
        eventDate: block.eventDate,
        slots: block.slots,
        type: block.type,
        reason: block.reason,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load calendar",
    });
  }
}

export async function createAvailabilityBlocks(
  req: Request,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const spaceKey =
      typeof req.body.spaceKey === "string" && req.body.spaceKey.trim()
        ? req.body.spaceKey.trim()
        : "main-hall";

    const type = String(req.body.type || "");
    const reason = String(req.body.reason || "").trim();
    const rawBlocks = Array.isArray(req.body.blocks) ? req.body.blocks : [];

    if (
      !blockTypes.includes(type as (typeof blockTypes)[number]) ||
      rawBlocks.length === 0 ||
      rawBlocks.length > 252 ||
      reason.length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability-block information",
      });
    }

    const grouped = new Map<string, BookingSlot[]>();

    for (const item of rawBlocks) {
      const eventDate = String(item?.eventDate || "");
      const slot = String(item?.slot || "");

      if (!isValidDate(eventDate) || !isValidSlot(slot)) {
        return res.status(400).json({
          success: false,
          message: "Each block requires a valid date and slot",
        });
      }

      const dateSlots = grouped.get(eventDate) || [];

      if (!dateSlots.includes(slot)) {
        dateSlots.push(slot);
      }

      grouped.set(eventDate, dateSlots);
    }

    const conflicts = await Booking.find({
      spaceKey,
      status: { $in: activeStatuses },
      $or: Array.from(grouped.entries()).map(([eventDate, dateSlots]) => ({
        eventDate,
        slot: { $in: dateSlots },
      })),
    })
      .select("eventDate slot eventTypeKey")
      .lean();

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "A held or confirmed booking already exists on at least one selected slot",
        conflicts: conflicts.map((booking) => ({
          eventDate: booking.eventDate,
          slot: booking.slot,
          eventTypeKey: booking.eventTypeKey,
        })),
      });
    }

    const availabilityBlockModel: any = AvailabilityBlock;

    for (const [eventDate, dateSlots] of grouped.entries()) {
      await availabilityBlockModel.findOneAndUpdate(
        {
          spaceKey,
          eventDate,
          type,
          active: true,
        },
        {
          $set: {
            reason: reason || undefined,
            createdBy: req.user.id,
          },
          $addToSet: {
            slots: { $each: dateSlots },
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );
    }

    return res.status(201).json({
      success: true,
      message: "Availability blocks created",
    });
  } catch (error) {
    console.error("Create availability block error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create availability blocks",
    });
  }
}

export async function deleteAvailabilityBlock(
  req: Request,
  res: Response
) {
  try {
    const blockId = getParam(req.params.blockId);

    if (!blockId || !mongoose.isValidObjectId(blockId)) {
      return res.status(400).json({
        success: false,
        message: "A valid block ID is required",
      });
    }

    const block = await AvailabilityBlock.findOneAndUpdate(
      { _id: blockId, active: true },
      { $set: { active: false } },
      { new: true }
    );

    if (!block) {
      return res.status(404).json({
        success: false,
        message: "Active availability block not found",
      });
    }

    return res.json({
      success: true,
      message: "Availability block removed",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to remove availability block",
    });
  }
}