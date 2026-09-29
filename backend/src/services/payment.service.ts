import { Payment, type PaymentMethod } from "../models/Payment";
import { Booking } from "../models/Booking";

export async function createPaymentForBooking(
  bookingId: string,
  method: PaymentMethod
) {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "HELD") {
    throw new Error("Booking must be held before payment");
  }

  if (
    !booking.holdExpiresAt ||
    booking.holdExpiresAt.getTime() <= Date.now()
  ) {
    booking.status = "EXPIRED";
    booking.activeSlotKey = undefined;
    booking.holdExpiresAt = undefined;
    await booking.save();

    throw new Error("Booking hold has expired");
  }

  const existingPayment = await Payment.findOne({
    bookingId: booking._id,
    status: "PENDING",
  });

  if (existingPayment) {
    return existingPayment;
  }

  try {
    return await Payment.create({
      bookingId: booking._id,
      method,
      amountDZD: booking.depositDZD,
      status: "PENDING",
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      const pendingPayment = await Payment.findOne({
        bookingId: booking._id,
        status: "PENDING",
      });

      if (pendingPayment) {
        return pendingPayment;
      }
    }

    throw error;
  }
}