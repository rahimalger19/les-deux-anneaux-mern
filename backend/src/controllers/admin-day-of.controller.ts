import mongoose from "mongoose";
import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { EventDayPlan } from "../models/EventDayPlan";
import { Booking, type BookingStatus } from "../models/Booking";
import { User, type UserRole } from "../models/User";

const eligibleBookingStatuses: BookingStatus[] = [
  "INVOICED",
  "DONE",
];

const staffRoles: UserRole[] = [
  "RECEPTION",
  "MANAGER",
  "COMPTA",
];

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function getClient(booking: any) {
  const user =
    booking.userId &&
    typeof booking.userId === "object" &&
    "name" in booking.userId
      ? booking.userId
      : null;

  return user
    ? {
        name: user.name,
        email: user.email || null,
        phone: user.phone || null,
      }
    : {
        name: "Client invité",
        email: null,
        phone: booking.guestPhone || null,
      };
}

function serializeBooking(booking: any, planUpdatedAt: Date | null) {
  return {
    id: booking._id.toString(),
    eventDate: booking.eventDate,
    slot: booking.slot,
    eventTypeKey: booking.eventTypeKey,
    womenGuests: booking.womenGuests,
    menGuests: booking.menGuests,
    status: booking.status,
    client: getClient(booking),
    hasPlan: Boolean(planUpdatedAt),
    planUpdatedAt,
  };
}

export async function getDayOfBookings(_req: Request, res: Response) {
  try {
    const bookings = await Booking.find({
      status: { $in: eligibleBookingStatuses },
    })
      .populate("userId", "name email phone")
      .select(
        "eventDate slot eventTypeKey womenGuests menGuests guestPhone userId status"
      )
      .sort({ eventDate: 1, slot: 1 })
      .lean();

    const plans = await EventDayPlan.find({
      bookingId: { $in: bookings.map((booking) => booking._id) },
    })
      .select("bookingId updatedAt")
      .lean();

    const planUpdatedAtByBookingId = new Map(
      plans.map((plan) => [
        plan.bookingId.toString(),
        plan.updatedAt || null,
      ])
    );

    return res.json({
      success: true,
      bookings: (bookings as any[]).map((booking) =>
        serializeBooking(
          booking,
          planUpdatedAtByBookingId.get(booking._id.toString()) || null
        )
      ),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load day-of-event bookings",
    });
  }
}

export async function getDayOfPlan(req: Request, res: Response) {
  try {
    const bookingId = getParam(req.params.bookingId);

    if (!bookingId || !mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "A valid booking ID is required",
      });
    }

    const [booking, plan, staffMembers] = await Promise.all([
      Booking.findOne({
        _id: bookingId,
        status: { $in: eligibleBookingStatuses },
      })
        .populate("userId", "name email phone")
        .select(
          "eventDate slot eventTypeKey womenGuests menGuests guestPhone userId status"
        )
        .lean(),

      EventDayPlan.findOne({ bookingId })
        .populate("entries.staffUserId", "name role")
        .lean(),

      User.find({
        role: { $in: staffRoles },
      })
        .select("name role")
        .sort({ name: 1 })
        .lean(),
    ]);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Invoiced or completed booking not found",
      });
    }

    return res.json({
      success: true,
      booking: serializeBooking(booking, plan?.updatedAt || null),
      staffMembers: staffMembers.map((staff) => ({
        id: staff._id.toString(),
        name: staff.name,
        role: staff.role,
      })),
      plan: {
        entries: ((plan?.entries || []) as any[]).map((entry) => ({
          time: entry.time,
          dayOffset: entry.dayOffset || 0,
          label: entry.label,
          staffUserId: entry.staffUserId
            ? String(entry.staffUserId._id || entry.staffUserId)
            : undefined,
          notes: entry.notes || undefined,
        })),
        updatedAt: plan?.updatedAt || null,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load day-of-event plan",
    });
  }
}

export async function saveDayOfPlan(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const bookingId = getParam(req.params.bookingId);
    const rawEntries: unknown[] = Array.isArray(req.body.entries)
  ? req.body.entries
  : [];

    if (
      !bookingId ||
      !mongoose.isValidObjectId(bookingId) ||
      rawEntries.length === 0 ||
      rawEntries.length > 60
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide between 1 and 60 run-of-show entries",
      });
    }

    type ParsedRunSheetEntry = {
  time: string;
  dayOffset: number;
  label: string;
  staffUserId: string;
  notes?: string;
};

const entries: ParsedRunSheetEntry[] = rawEntries.map((entry) => {
  const raw =
    entry && typeof entry === "object"
      ? (entry as Record<string, unknown>)
      : {};

  return {
    time: String(raw.time || "").trim(),
    dayOffset: Number(raw.dayOffset ?? 0),
    label: String(raw.label || "").trim(),
    staffUserId:
      typeof raw.staffUserId === "string"
        ? raw.staffUserId.trim()
        : "",
    notes: String(raw.notes || "").trim() || undefined,
  };
});

    const staffIds = new Set<string>();

    for (const entry of entries) {
      if (
        !isValidTime(entry.time) ||
        ![0, 1].includes(entry.dayOffset) ||
        !entry.label ||
        entry.label.length > 200 ||
        (entry.notes && entry.notes.length > 500)
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more run-of-show entries are invalid",
        });
      }

      if (entry.staffUserId) {
        if (!mongoose.isValidObjectId(entry.staffUserId)) {
          return res.status(400).json({
            success: false,
            message: "An assigned staff member is invalid",
          });
        }

        staffIds.add(entry.staffUserId);
      }
    }

    const [booking, validStaff] = await Promise.all([
      Booking.findOne({
        _id: bookingId,
        status: { $in: eligibleBookingStatuses },
      }).select("_id"),

      staffIds.size > 0
        ? User.find({
            _id: { $in: [...staffIds] },
            role: { $in: staffRoles },
          }).select("_id")
        : Promise.resolve([]),
    ]);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Invoiced or completed booking not found",
      });
    }

    if (validStaff.length !== staffIds.size) {
      return res.status(400).json({
        success: false,
        message: "A selected staff member is unavailable",
      });
    }

    const normalizedEntries: Array<{
  time: string;
  dayOffset: 0 | 1;
  label: string;
  staffUserId?: string;
  notes?: string;
}> = entries
  .map((entry) => ({
    time: entry.time,
    dayOffset: entry.dayOffset as 0 | 1,
    label: entry.label,
    staffUserId: entry.staffUserId || undefined,
    notes: entry.notes,
  }))
  .sort(
    (left, right) =>
      left.dayOffset - right.dayOffset ||
      left.time.localeCompare(right.time)
  );

    const plan = await EventDayPlan.findOneAndUpdate(
      { bookingId: booking._id },
      {
        $set: {
          entries: normalizedEntries,
          updatedBy: req.user.id,
        },
        $setOnInsert: {
          bookingId: booking._id,
          createdBy: req.user.id,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    if (!plan) {
  throw new Error("Unable to save day-of-event plan");
}

    await AuditLog.create({
      actorId: req.user.id,
      action: "DAY_OF_PLAN_SAVED",
      entityType: "EventDayPlan",
      entityId: plan._id.toString(),
      metadata: {
        bookingId: booking._id.toString(),
        entryCount: normalizedEntries.length,
        nextDayEntryCount: normalizedEntries.filter(
          (entry) => entry.dayOffset === 1
        ).length,
      },
    });

    return res.json({
      success: true,
      message: "Day-of-event plan saved",
      planUpdatedAt: plan.updatedAt,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to save day-of-event plan",
    });
  }
}