import { randomBytes } from "crypto";
import type { Request, Response } from "express";
import {
  Booking,
  BOOKING_SLOTS,
  type BookingSlot,
  type BookingStatus,
} from "../models/Booking";
import { calculateBookingEstimate } from "../services/pricing.service";
import {
  createActiveSlotKey,
  expireBookingHolds,
} from "../services/booking.service";

import type { PricingMarket } from "../models/Booking";
import {
  createOtpForBooking,
  discardUnusedOtpForBooking,
  resendOtpForBooking,
  verifyOtpForBooking,
} from "../services/otp.service";
import { AvailabilityBlock } from "../models/AvailabilityBlock";
import { sendOtpSms } from "../services/sms.service";
import mongoose from "mongoose";
import { createProFormaForBooking } from "../services/proforma.service";

const activeStatuses: BookingStatus[] = [
  "HELD",
  "PROOF_PENDING",
  "PAID",
  "INVOICED",
  "DONE",
];

function isValidDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidSlot(slot: string): slot is BookingSlot {
  return BOOKING_SLOTS.includes(slot as BookingSlot);
}
function isValidPricingMarket(
  pricingMarket: string
): pricingMarket is PricingMarket {
  return pricingMarket === "RESIDENT" || pricingMarket === "DIASPORA";
}

async function isSlotAvailable(
  eventDate: string,
  slot: BookingSlot,
  spaceKey: string
) {
  await expireBookingHolds();

  const [activeBooking, activeBlock] = await Promise.all([
    Booking.findOne({
      eventDate,
      slot,
      spaceKey,
      status: { $in: activeStatuses },
    })
      .select("_id")
      .lean(),

    AvailabilityBlock.findOne({
      eventDate,
      spaceKey,
      slots: slot,
      active: true,
    })
      .select("_id")
      .lean(),
  ]);

  return !activeBooking && !activeBlock;
}

export async function checkAvailability(req: Request, res: Response) {
  try {
    const date = String(req.query.date || "");
    const slot = String(req.query.slot || "");
    const spaceKey = String(req.query.space || "main-hall");

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "date must use YYYY-MM-DD format",
      });
    }

    if (!isValidSlot(slot)) {
      return res.status(400).json({
        success: false,
        message: "Invalid slot",
      });
    }

    const available = await isSlotAvailable(date, slot, spaceKey);

    return res.json({
      success: true,
      date,
      slot,
      spaceKey,
      available,
    });
  } catch (error) {
    console.error("Availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check availability",
    });
  }
}

export async function estimateBooking(req: Request, res: Response) {
  try { 
   const {
  eventTypeKey,
  packKey,
  womenGuests,
  menGuests,
  slot,
  pricingMarket,
  optionKeys,
  eventDate,
} = req.body;

    const women = Number(womenGuests);
    const men = Number(menGuests);

    if (
  !eventDate ||
  !isValidDate(eventDate) ||
  !eventTypeKey ||
  !packKey ||
  !slot ||
  !pricingMarket
) {
      return res.status(400).json({
        success: false,
        message: "eventTypeKey, packKey and slot are required",
      });
    }

    if (
      !Number.isInteger(women) ||
      !Number.isInteger(men) ||
      women < 0 ||
      men < 0 ||
      women + men < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Guest counts must be valid positive numbers",
      });
    }

    if (!isValidSlot(slot)) {
      return res.status(400).json({
        success: false,
        message: "Invalid slot",
      });
    }
if (!isValidPricingMarket(pricingMarket)) {
  return res.status(400).json({
    success: false,
    message: "Invalid pricing market",
  });
}

    const estimate = await calculateBookingEstimate({
      eventTypeKey,
      packKey,
      womenGuests: women,
      menGuests: men,
      slot,
      pricingMarket,
      optionKeys,
      eventDate,
    });

    return res.json({ success: true, estimate });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to calculate estimate";

    return res.status(400).json({ success: false, message });
  }
}

export async function createGuestDraft(req: Request, res: Response) {
  try {
    const {
  eventDate,
  slot,
  eventTypeKey,
  packKey,
  womenGuests,
  menGuests,
  phone,
  pricingMarket,
  optionKeys,
} = req.body;

    const women = Number(womenGuests);
    const men = Number(menGuests);
    const spaceKey = "main-hall";

    if (
      !isValidDate(eventDate) ||
      !isValidSlot(slot) ||
      !eventTypeKey ||
      !packKey ||
      !phone
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid booking information",
      });
    }

    if (
      !Number.isInteger(women) ||
      !Number.isInteger(men) ||
      women < 0 ||
      men < 0 ||
      women + men < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Guest counts must be valid",
      });
    }
    if (!isValidPricingMarket(pricingMarket)) {
  return res.status(400).json({
    success: false,
    message: "Invalid pricing market",
  });
}

    if (String(phone).trim().length < 8) {
      return res.status(400).json({
        success: false,
        message: "A valid phone number is required",
      });
    }

    const available = await isSlotAvailable(eventDate, slot, spaceKey);

    if (!available) {
      return res.status(409).json({
        success: false,
        message: "This slot is no longer available",
      });
    }

    const estimate = await calculateBookingEstimate({
      eventTypeKey,
      packKey,
      womenGuests: women,
      menGuests: men,
      slot,
      pricingMarket,
      optionKeys,
      eventDate,
    });

    const booking = await Booking.create({
      guestToken: randomBytes(24).toString("hex"),
      guestPhone: String(phone).trim(),
      spaceKey,
      eventTypeKey,
      eventDate,
      slot,
      womenGuests: women,
      menGuests: men,
      packKey,
      optionKeys: Array.isArray(optionKeys)
  ? [...new Set(optionKeys.filter((key) => typeof key === "string"))]
  : [],
      currency: "DZD",
      totalDZD: estimate.pricing.totalDZD,
      depositDZD: estimate.pricing.depositDZD,
      status: "OTP_PENDING",
      userId: req.user?.id,
      pricingMarket,
    });

    const issuedOtp = await createOtpForBooking(booking._id.toString());

try {
  await sendOtpSms(booking.guestPhone!, issuedOtp.code);
} catch (error) {
  await discardUnusedOtpForBooking(booking._id.toString());

  await Booking.deleteOne({
    _id: booking._id,
    status: "OTP_PENDING",
  });

  throw error;
}

return res.status(201).json({
  success: true,
  message: "OTP sent",
  bookingId: booking._id,
  trackingToken: booking.guestToken,
  expiresInSeconds: issuedOtp.expiresInSeconds,
  ...(process.env.NODE_ENV !== "production"
    ? { developmentOtp: issuedOtp.code }
    : {}),
});
  } catch (error) {
    console.error("Create guest draft error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create booking draft",
    });
  }
}

export async function verifyGuestOtp(req: Request, res: Response) {
  try {
    const rawBookingId = req.params.bookingId;
    const bookingId = Array.isArray(rawBookingId)
      ? rawBookingId[0]
      : rawBookingId;

    const { code } = req.body;

    if (!bookingId || !mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "A valid booking ID is required",
      });
    }

    if (!/^\d{6}$/.test(String(code || "").trim())) {
      return res.status(400).json({
        success: false,
        message: "A 6-digit OTP code is required",
      });
    }

    const booking = await Booking.findById(bookingId);

   if (!booking) {
  return res.status(404).json({
    success: false,
    message: "Booking not found",
  });
}

if (booking.status === "HELD") {
  return res.json({
    success: true,
    message: "OTP already verified. Your slot is still held.",
    bookingId: booking._id,
    trackingToken: booking.guestToken,
    holdExpiresAt: booking.holdExpiresAt,
  });
}

if (booking.status !== "OTP_PENDING") {
  return res.status(409).json({
    success: false,
    message: `This OTP can no longer be verified. Current status: ${booking.status}`,
  });
}

    const otpResult = await verifyOtpForBooking(bookingId, String(code));

    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.message,
      });
    }

    const stillAvailable = await isSlotAvailable(
  booking.eventDate,
  booking.slot,
  booking.spaceKey
);

if (!stillAvailable) {
  return res.status(409).json({
    success: false,
    message: "This slot is no longer available",
  });
}

booking.status = "HELD";
    booking.holdExpiresAt = new Date(Date.now() + 20 * 60 * 1000);
    booking.activeSlotKey = createActiveSlotKey(
      booking.spaceKey,
      booking.eventDate,
      booking.slot
    );

    try {
  await booking.save();
} catch (error: any) {
  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "This slot was booked by another client",
    });
  }

  throw error;
}

const proForma = await createProFormaForBooking(
  booking._id.toString()
);

    return res.json({
      success: true,
      message: "OTP verified. Your slot is held for 20 minutes.",
      bookingId: booking._id,
      trackingToken: booking.guestToken,
      holdExpiresAt: booking.holdExpiresAt,
      proFormaNumber: proForma.proFormaNumber,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP",
    });
  }
}

export async function getGuestTracking(req: Request, res: Response) {
  try {
    const rawToken = req.params.token;
    const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Tracking token is required",
      });
    }

    await expireBookingHolds();

    const booking = await Booking.findOne({ guestToken: token })
      .select(
        "eventDate slot eventTypeKey packKey womenGuests menGuests totalDZD depositDZD currency status holdExpiresAt createdAt"
      )
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.json({
      success: true,
      booking: {
        id: booking._id,
        eventDate: booking.eventDate,
        slot: booking.slot,
        eventTypeKey: booking.eventTypeKey,
        packKey: booking.packKey,
        womenGuests: booking.womenGuests,
        menGuests: booking.menGuests,
        totalDZD: booking.totalDZD,
        depositDZD: booking.depositDZD,
        currency: booking.currency,
        status: booking.status,
        holdExpiresAt: booking.holdExpiresAt,
        createdAt: booking.createdAt,
      },
    });
  } catch (error) {
    console.error("Guest tracking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load booking tracking",
    });
  }
}

export async function getMyBookings(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const bookings = await Booking.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .select(
        "eventDate slot eventTypeKey packKey optionKeys pricingMarket womenGuests menGuests totalDZD depositDZD currency status holdExpiresAt createdAt updatedAt"      )
      .lean();

    return res.json({
      success: true,
      bookings: bookings.map((booking) => ({
        id: booking._id,
        ...booking,
      })),
    });
  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load reservations",
    });
  }
}

export async function getMyBookingDetails(req: Request, res: Response) {
  try {
    const rawBookingId = req.params.bookingId;
    const bookingId = Array.isArray(rawBookingId)
      ? rawBookingId[0]
      : rawBookingId;

    if (!req.user || !bookingId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user.id,
    })
      .select(
      "eventDate slot eventTypeKey packKey optionKeys pricingMarket womenGuests menGuests totalDZD depositDZD currency status holdExpiresAt createdAt updatedAt")
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    return res.json({
      success: true,
      booking: {
        id: booking._id,
        ...booking,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load reservation",
    });
  }
}

export async function resendGuestOtp(req: Request, res: Response) {
  try {
    const rawBookingId = req.params.bookingId;

    const bookingId = Array.isArray(rawBookingId)
      ? rawBookingId[0]
      : rawBookingId;

    if (!bookingId || !mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "A valid booking ID is required",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking || booking.status !== "OTP_PENDING") {
      return res.status(404).json({
        success: false,
        message: "Booking draft not found",
      });
    }

    const result = await resendOtpForBooking(bookingId);

    if (!result.sent) {
      return res.status(429).json({
        success: false,
        message: "The current OTP is still valid",
        retryAt: result.retryAt,
        expiresInSeconds: Math.max(
          0,
          Math.ceil((result.retryAt.getTime() - Date.now()) / 1000)
        ),
      });
    }

    try {
      await sendOtpSms(booking.guestPhone!, result.code);
    } catch (error) {
      await discardUnusedOtpForBooking(bookingId);
      throw error;
    }

    return res.json({
      success: true,
      message: "OTP sent",
      expiresInSeconds: result.expiresInSeconds,
      ...(process.env.NODE_ENV !== "production"
        ? { developmentOtp: result.code }
        : {}),
    });
  } catch (error) {
    console.error("Resend OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to resend OTP",
    });
  }
}

export async function saveMyDraft(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      eventDate,
      slot,
      eventTypeKey,
      packKey,
      womenGuests,
      menGuests,
      pricingMarket,
      spaceKey,
      optionKeys,
    } = req.body;

    const women = Number(womenGuests);
    const men = Number(menGuests);

    if (
      !isValidDate(eventDate) ||
      !isValidSlot(slot) ||
      !eventTypeKey ||
      !packKey ||
      !["RESIDENT", "DIASPORA"].includes(pricingMarket) ||
      !Number.isInteger(women) ||
      !Number.isInteger(men) ||
      women < 0 ||
      men < 0 ||
      women + men < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid draft information",
      });
    }

    const cleanOptionKeys = Array.isArray(optionKeys)
      ? [
          ...new Set(
            optionKeys
              .filter(
                (value): value is string =>
                  typeof value === "string" && value.trim().length > 0
              )
              .map((value) => value.trim())
          ),
        ]
      : [];

    const estimate = await calculateBookingEstimate({
      eventTypeKey,
      packKey,
      womenGuests: women,
      menGuests: men,
      slot,
      pricingMarket,
      optionKeys,
      eventDate,
    });

    const booking = await Booking.create({
      userId: req.user.id,
      guestToken: randomBytes(24).toString("hex"),
      spaceKey:
        typeof spaceKey === "string" && spaceKey.trim()
          ? spaceKey.trim()
          : "main-hall",
      eventTypeKey,
      eventDate,
      slot,
      womenGuests: women,
      menGuests: men,
      packKey,
      optionKeys: cleanOptionKeys,
      pricingMarket,
      currency: "DZD",
      totalDZD: estimate.pricing.totalDZD,
      depositDZD: estimate.pricing.depositDZD,
      status: "DRAFT",
    });

    return res.status(201).json({
      success: true,
      message: "Draft saved",
      booking: {
        id: booking._id,
        status: booking.status,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save draft";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}