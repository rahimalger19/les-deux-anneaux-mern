import { Booking } from "../models/Booking";
import { DocumentCounter } from "../models/DocumentCounter";

async function generateDocumentNumber(type: "PRO" | "FACT") {
  const year = new Date().getFullYear();

  const counter = await DocumentCounter.findOneAndUpdate(
    { type, year },
    { $inc: { sequence: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return `${type}-${year}-${String(counter.sequence).padStart(4, "0")}`;
}

export async function getBookingForDocument(bookingId: string) {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new Error("Booking not found");
  }

  return booking;
}

export async function generateProFormaNumber() {
  return generateDocumentNumber("PRO");
}

export async function generateInvoiceNumber() {
  return generateDocumentNumber("FACT");
}