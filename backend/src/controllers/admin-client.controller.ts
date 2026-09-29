import mongoose from "mongoose";
import type { Request, Response } from "express";
import { Appointment } from "../models/Appointment";
import { Booking } from "../models/Booking";
import { Payment } from "../models/Payment";
import { User } from "../models/User";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getUserSearchFilter(search: string) {
  const filter: Record<string, unknown> = { role: "CLIENT" };

  if (!search) {
    return filter;
  }

  const expression = new RegExp(escapeRegex(search), "i");

  filter.$or = [
    { name: expression },
    { email: expression },
    { phone: expression },
  ];

  return filter;
}

function toBookingResponse(booking: any, hasGuestOtp: boolean) {
  return {
    id: booking._id.toString(),
    eventDate: booking.eventDate,
    slot: booking.slot,
    eventTypeKey: booking.eventTypeKey,
    packKey: booking.packKey,
    pricingMarket: booking.pricingMarket,
    totalDZD: booking.totalDZD,
    depositDZD: booking.depositDZD,
    currency: booking.currency,
    status: booking.status,
    guestPhone: booking.guestPhone,
    hasGuestOtp,
    createdAt: booking.createdAt,
  };
}

export async function getAdminClients(req: Request, res: Response) {
  try {
    const search = String(req.query.search || "").trim();
    const guestPhoneFilter = search
      ? { $regex: escapeRegex(search), $options: "i" }
      : { $exists: true, $ne: "" };

    const users = await User.find(getUserSearchFilter(search))
      .select("name email phone createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const userIds = users.map((user) => user._id);

    const accountBookingStats =
      userIds.length === 0
        ? []
        : await Booking.aggregate([
            {
              $match: {
                userId: { $in: userIds },
              },
            },
            {
              $group: {
                _id: "$userId",
                bookingCount: { $sum: 1 },
                diasporaCount: {
                  $sum: {
                    $cond: [
                      { $eq: ["$pricingMarket", "DIASPORA"] },
                      1,
                      0,
                    ],
                  },
                },
                lastBookingAt: { $max: "$createdAt" },
              },
            },
          ]);

    const guestBookingStats = await Booking.aggregate([
      {
        $match: {
          guestPhone: guestPhoneFilter,
          guestToken: { $exists: true, $ne: "" },
          $or: [{ userId: { $exists: false } }, { userId: null }],
        },
      },
      {
        $group: {
          _id: "$guestPhone",
          bookingCount: { $sum: 1 },
          diasporaCount: {
            $sum: {
              $cond: [
                { $eq: ["$pricingMarket", "DIASPORA"] },
                1,
                0,
              ],
            },
          },
          lastBookingAt: { $max: "$createdAt" },
        },
      },
      {
        $sort: { lastBookingAt: -1 },
      },
      {
        $limit: 100,
      },
    ]);

    const accountStats = new Map(
      accountBookingStats.map((item) => [item._id.toString(), item])
    );

    const accountClients = users.map((user) => {
      const stats = accountStats.get(user._id.toString());

      return {
        id: user._id.toString(),
        kind: "USER" as const,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        bookingCount: stats?.bookingCount || 0,
        diaspora: (stats?.diasporaCount || 0) > 0,
        lastBookingAt: stats?.lastBookingAt || null,
      };
    });

    const guestClients = guestBookingStats.map((guest) => ({
      id: String(guest._id),
      kind: "GUEST" as const,
      name: "Client invité",
      email: null,
      phone: String(guest._id),
      bookingCount: guest.bookingCount,
      diaspora: guest.diasporaCount > 0,
      lastBookingAt: guest.lastBookingAt || null,
    }));

    const clients = [...accountClients, ...guestClients].sort((left, right) => {
      const leftDate = left.lastBookingAt
        ? new Date(left.lastBookingAt).getTime()
        : 0;
      const rightDate = right.lastBookingAt
        ? new Date(right.lastBookingAt).getTime()
        : 0;

      return rightDate - leftDate;
    });

    return res.json({ success: true, clients });
  } catch (error) {
    console.error("Admin clients error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load clients",
    });
  }
}

export async function getAdminClientDetails(req: Request, res: Response) {
  try {
    const kind = getParam(req.params.kind);
    const id = getParam(req.params.id);

    if (!id || (kind !== "USER" && kind !== "GUEST")) {
      return res.status(400).json({
        success: false,
        message: "Invalid client identifier",
      });
    }

    if (kind === "USER") {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid client account identifier",
        });
      }

      const user = await User.findOne({
        _id: id,
        role: "CLIENT",
      })
        .select("name email phone language currency createdAt")
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Client account not found",
        });
      }

      const bookings = await Booking.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .select(
          "eventDate slot eventTypeKey packKey pricingMarket totalDZD depositDZD currency status guestPhone createdAt"
        )
        .lean();

      const bookingIds = bookings.map((booking) => booking._id);

      const [payments, appointments] = await Promise.all([
        bookingIds.length
          ? Payment.find({ bookingId: { $in: bookingIds } })
              .sort({ createdAt: -1 })
              .select(
                "bookingId method amountDZD reference status rejectionReason createdAt validatedAt"
              )
              .lean()
          : [],
        Appointment.find({ userId: user._id })
          .sort({ createdAt: -1 })
          .select(
            "type source requestedSlot appointmentSlot scheduledAt status createdAt"
          )
          .lean(),
      ]);

      return res.json({
        success: true,
        client: {
          id: user._id.toString(),
          kind: "USER",
          name: user.name,
          email: user.email,
          phone: user.phone || null,
          language: user.language,
          currency: user.currency,
          accountCreatedAt: user.createdAt,
          diaspora: bookings.some(
            (booking) => booking.pricingMarket === "DIASPORA"
          ),
        },
        bookings: bookings.map((booking) =>
          toBookingResponse(booking, false)
        ),
        payments: (payments as any[]).map((payment) => ({
          id: payment._id.toString(),
          bookingId: payment.bookingId.toString(),
          method: payment.method,
          amountDZD: payment.amountDZD,
          reference: payment.reference,
          status: payment.status,
          rejectionReason: payment.rejectionReason,
          createdAt: payment.createdAt,
          validatedAt: payment.validatedAt,
        })),
        appointments: (appointments as any[]).map((appointment) => ({
          id: appointment._id.toString(),
          type: appointment.type,
          source: appointment.source,
          requestedSlot: appointment.requestedSlot,
          appointmentSlot: appointment.appointmentSlot,
          scheduledAt: appointment.scheduledAt,
          status: appointment.status,
          createdAt: appointment.createdAt,
        })),
      });
    }

    const bookings = await Booking.find({
      guestPhone: id,
      guestToken: { $exists: true, $ne: "" },
      $or: [{ userId: { $exists: false } }, { userId: null }],
    })
      .sort({ createdAt: -1 })
      .select(
        "eventDate slot eventTypeKey packKey pricingMarket totalDZD depositDZD currency status guestPhone createdAt"
      )
      .lean();

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Guest OTP client not found",
      });
    }

    const bookingIds = bookings.map((booking) => booking._id);

    const [payments, appointments] = await Promise.all([
      Payment.find({ bookingId: { $in: bookingIds } })
        .sort({ createdAt: -1 })
        .select(
          "bookingId method amountDZD reference status rejectionReason createdAt validatedAt"
        )
        .lean(),
      Appointment.find({
        source: "CONTACT",
        guestPhone: id,
      })
        .sort({ createdAt: -1 })
        .select(
          "type source requestedSlot appointmentSlot scheduledAt status createdAt"
        )
        .lean(),
    ]);

    return res.json({
      success: true,
      client: {
        id,
        kind: "GUEST",
        name: "Client invité",
        email: null,
        phone: id,
        language: null,
        currency: null,
        accountCreatedAt: null,
        diaspora: bookings.some(
          (booking) => booking.pricingMarket === "DIASPORA"
        ),
      },
      bookings: bookings.map((booking) =>
        toBookingResponse(booking, true)
      ),
      payments: (payments as any[]).map((payment) => ({
        id: payment._id.toString(),
        bookingId: payment.bookingId.toString(),
        method: payment.method,
        amountDZD: payment.amountDZD,
        reference: payment.reference,
        status: payment.status,
        rejectionReason: payment.rejectionReason,
        createdAt: payment.createdAt,
        validatedAt: payment.validatedAt,
      })),
      appointments: (appointments as any[]).map((appointment) => ({
        id: appointment._id.toString(),
        type: appointment.type,
        source: appointment.source,
        requestedSlot: appointment.requestedSlot,
        appointmentSlot: appointment.appointmentSlot,
        scheduledAt: appointment.scheduledAt,
        status: appointment.status,
        createdAt: appointment.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin client detail error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load client file",
    });
  }
}