export type BookingSlot = "AFTERNOON" | "EVENING" | "NIGHT" | "DAY";

export type AvailabilityResponse = {
  success: boolean;
  date: string;
  slot: BookingSlot;
  spaceKey: string;
  available: boolean;
};