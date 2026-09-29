import { api } from "../api/client";

export type BookingStatus =
  | "DRAFT"
  | "PRICED"
  | "OTP_PENDING"
  | "HELD"
  | "PROOF_PENDING"
  | "PAID"
  | "INVOICED"
  | "DONE"
  | "CANCELLED"
  | "EXPIRED";

export type ClientBooking = {
  id: string;
  eventDate: string;
  slot: string;
  eventTypeKey: string;
  packKey?: string;
  optionKeys: string[];
  pricingMarket: "RESIDENT" | "DIASPORA";
  womenGuests: number;
  menGuests: number;
  totalDZD: number;
  depositDZD: number;
  currency: "DZD" | "EUR" | "USD";
  status: BookingStatus;
  holdExpiresAt?: string;
  createdAt: string;
  updatedAt?: string;
};

export async function getMyBookings() {
  const response = await api.get<{
    success: boolean;
    bookings: ClientBooking[];
  }>("/bookings/my");

  return response.data.bookings;
}

export async function getMyBookingDetails(bookingId: string) {
  const response = await api.get<{
    success: boolean;
    booking: ClientBooking;
  }>(`/bookings/my/${bookingId}`);

  return response.data.booking;
}