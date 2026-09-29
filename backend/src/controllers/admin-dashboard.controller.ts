import type { Request, Response } from "express";
import { Appointment } from "../models/Appointment";
import { Booking } from "../models/Booking";
import { Payment } from "../models/Payment";

function getAlgeriaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Algiers",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);

  return value.toISOString().slice(0, 10);
}

export async function getAdminDashboard(_req: Request, res: Response) {
  try {
    const today = getAlgeriaDate();
    const until = addDays(today, 7);

    const todayStart = new Date(`${today}T00:00:00+01:00`);
    const todayEnd = new Date(`${addDays(today, 1)}T00:00:00+01:00`);

    const [upcomingBookings, expiringHolds, pendingProofs, appointments] =
      await Promise.all([
        Booking.find({
  eventDate: { $gte: today, $lte: until },
  status: {
    $in: ["HELD", "PROOF_PENDING", "PAID", "INVOICED", "DONE"],
  },
})
  .select(
    "eventDate slot eventTypeKey status womenGuests menGuests holdExpiresAt"
  )
  .sort({ eventDate: 1, slot: 1 })
  .lean(),

        Booking.find({
          status: { $in: ["HELD", "PROOF_PENDING"] },
          holdExpiresAt: {
            $gt: new Date(),
            $lte: new Date(Date.now() + 60 * 60 * 1000),
          },
        })
          .sort({ holdExpiresAt: 1 })
          .lean(),

        Payment.find({
          status: "PENDING",
          proofUrl: { $exists: true, $ne: null },
        })
          .populate(
            "bookingId",
            "eventDate slot eventTypeKey guestPhone depositDZD"
          )
          .sort({ createdAt: -1 })
          .lean(),

        Appointment.find({
          scheduledAt: { $gte: todayStart, $lt: todayEnd },
          status: { $in: ["PENDING", "CONFIRMED"] },
        })
          .sort({ scheduledAt: 1 })
          .populate("userId", "name email phone")
          .lean(),
      ]);

    return res.json({
      success: true,
      period: {
        today,
        until,
      },
      upcomingSlots: upcomingBookings.map((booking) => ({
        id: booking._id.toString(),
        eventDate: booking.eventDate,
        slot: booking.slot,
        eventTypeKey: booking.eventTypeKey,
        status: booking.status,
        womenGuests: booking.womenGuests,
        menGuests: booking.menGuests,
      })),
      expiringHolds: expiringHolds.map((booking) => ({
        id: booking._id.toString(),
        eventDate: booking.eventDate,
        slot: booking.slot,
        eventTypeKey: booking.eventTypeKey,
        holdExpiresAt: booking.holdExpiresAt,
      })),
      pendingProofs: (pendingProofs as any[]).map((payment) => ({
        id: payment._id.toString(),
        method: payment.method,
        amountDZD: payment.amountDZD,
        proofFileName: payment.proofFileName,
        booking: payment.bookingId
          ? {
              id: payment.bookingId._id.toString(),
              eventDate: payment.bookingId.eventDate,
              slot: payment.bookingId.slot,
              eventTypeKey: payment.bookingId.eventTypeKey,
            }
          : null,
      })),
      todayAppointments: (appointments as any[]).map((appointment) => ({
        id: appointment._id.toString(),
        type: appointment.type,
        scheduledAt: appointment.scheduledAt,
        status: appointment.status,
        client: appointment.userId
          ? {
              name: appointment.userId.name,
              email: appointment.userId.email,
              phone: appointment.userId.phone,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load admin dashboard",
    });
  }
}