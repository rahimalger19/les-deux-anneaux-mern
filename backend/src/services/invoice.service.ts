import { Invoice, type IInvoice } from "../models/Invoice";
import { Booking } from "../models/Booking";
import { generateInvoiceNumber } from "./document.service";
import type { HydratedDocument } from "mongoose";

export async function createInvoiceForBooking(bookingId: string) {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new Error("Booking not found");
  }

  const existingInvoice = await Invoice.findOne({
    bookingId: booking._id,
  });

  if (existingInvoice) {
    if (booking.status !== "INVOICED") {
      booking.status = "INVOICED";
      await booking.save();
    }

    return existingInvoice;
  }

  if (booking.status !== "PAID") {
    throw new Error(
      "Invoice can only be created after payment validation"
    );
  }

  let invoice: HydratedDocument<IInvoice>;

  try {
    invoice = await Invoice.create({
      bookingId: booking._id,
      invoiceNumber: await generateInvoiceNumber(),
      amountDZD: booking.depositDZD,
      status: "ISSUED",
      issuedAt: new Date(),
    });
  } catch (error: any) {
    if (error?.code !== 11000) {
      throw error;
    }

    const concurrentInvoice = await Invoice.findOne({
      bookingId: booking._id,
    });

    if (!concurrentInvoice) {
      throw error;
    }

    invoice = concurrentInvoice;
  }

  booking.status = "INVOICED";
  await booking.save();

  return invoice;
}