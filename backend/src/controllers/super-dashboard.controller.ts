import type { Request, Response } from "express";
import { Booking } from "../models/Booking";

export async function getSuperDashboard(
  _req: Request,
  res: Response
) {
  try {
      const onlineFilter: any = {
  $or: [
    { source: "ONLINE" },
    { source: { $exists: false } },
  ],
};

    const [revenueRows, funnelRows, slotRows, onlineTotal] =
      await Promise.all([
        Booking.aggregate([
          {
            $match: {
              status: { $in: ["INVOICED", "DONE"] },
            },
          },
          {
            $group: {
              _id: null,
              totalDZD: { $sum: "$totalDZD" },
              bookingCount: { $sum: 1 },
            },
          },
        ]),

        Booking.aggregate([
          { $match: onlineFilter },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),

        Booking.aggregate([
          {
            $match: {
              status: {
                $nin: ["CANCELLED", "EXPIRED"],
              },
            },
          },
          {
            $group: {
              _id: {
                $cond: [
                  { $eq: ["$slot", "NIGHT"] },
                  "NIGHT",
                  "DAY",
                ],
              },
              count: { $sum: 1 },
            },
          },
        ]),

        Booking.countDocuments(onlineFilter),
      ]);

    const funnel = Object.fromEntries(
      funnelRows.map((item) => [item._id, item.count])
    ) as Record<string, number>;

    const slotCounts = Object.fromEntries(
      slotRows.map((item) => [item._id, item.count])
    ) as Record<string, number>;

    const revenue = revenueRows[0] || {
      totalDZD: 0,
      bookingCount: 0,
    };

    return res.json({
      success: true,
      revenue: {
        totalDZD: revenue.totalDZD,
        invoicedBookings: revenue.bookingCount,
      },
      onlineFunnel: {
        started: onlineTotal,
        otpPending: funnel.OTP_PENDING || 0,
        held: funnel.HELD || 0,
        proofPending: funnel.PROOF_PENDING || 0,
        invoiced: funnel.INVOICED || 0,
        done: funnel.DONE || 0,
      },
      slotDistribution: {
        night: slotCounts.NIGHT || 0,
        day: slotCounts.DAY || 0,
      },
      instagram: {
        tracked: false,
        message:
          "Le taux de conversion Instagram sera disponible après SA-11 Tracking.",
      },
    });
  } catch (error) {
    console.error("Super dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load super admin dashboard",
    });
  }
}