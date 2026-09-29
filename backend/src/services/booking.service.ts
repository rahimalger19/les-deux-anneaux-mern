import { Booking } from "../models/Booking";

export function createActiveSlotKey(
  spaceKey: string,
  eventDate: string,
  slot: string
) {
  return `${spaceKey}:${eventDate}:${slot}`;
}

export async function expireBookingHolds() {
  await Booking.updateMany(
    {
      status: "HELD",
      holdExpiresAt: { $lte: new Date() },
    },
    {
      $set: { status: "EXPIRED" },
      $unset: {
        activeSlotKey: "",
        holdExpiresAt: "",
      },
    }
  );
}