import crypto from "crypto";
import { Booking } from "../models/Booking";
import { ProForma } from "../models/ProForma";
import { generateProFormaNumber } from "./document.service";

const allowedStatuses = [
  "HELD",
  "PROOF_PENDING",
  "PAID",
  "INVOICED",
  "DONE",
];

export function hashProFormaDownloadToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createProFormaForBooking(
  bookingId: string,
  issuedBy?: string
) {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (!allowedStatuses.includes(booking.status)) {
    throw new Error("Pro forma is available only after OTP confirmation");
  }

  const existing = await ProForma.findOne({
    bookingId: booking._id,
  });

  if (existing) {
    return existing;
  }

  try {
    return await ProForma.create({
      bookingId: booking._id,
      proFormaNumber: await generateProFormaNumber(),
      totalDZD: booking.totalDZD,
      depositDZD: booking.depositDZD,
      issuedAt: new Date(),
      issuedBy,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      const createdByAnotherRequest = await ProForma.findOne({
        bookingId: booking._id,
      });

      if (createdByAnotherRequest) {
        return createdByAnotherRequest;
      }
    }

    throw error;
  }
}

export async function createProFormaEmailLink(
  proFormaId: string,
  recipientEmail: string
) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const proForma = await ProForma.findByIdAndUpdate(
    proFormaId,
    {
      $set: {
        downloadTokenHash: hashProFormaDownloadToken(token),
        downloadTokenExpiresAt: expiresAt,
        sentTo: recipientEmail.toLowerCase(),
        sentAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  if (!proForma) {
    throw new Error("Pro forma not found");
  }

  return {
    token,
    expiresAt,
  };
}