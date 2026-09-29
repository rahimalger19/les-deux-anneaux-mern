import { api } from "../api/client";
import type {
  AvailabilityResponse,
  BookingSlot,
} from "../types/booking.types";

export type EstimateResponse = {
  success: boolean;
  estimate: {
    eventType: {
      key: string;
      depositPercent: number;
    };
    pack: {
      key: string;
      basePriceDZD: number;
    };
    pricing: {
      slot: BookingSlot;
      season: string;
      baseDZD: number;
      extraGuests: number;
      extraGuestsDZD: number;
      totalDZD: number;
      depositDZD: number;
      currency: "DZD";
      selectedServicesDZD: number;
      selectedServiceKeys: string[];
    };
  };
};

export type GuestDraftResponse = {
  success: boolean;
  message: string;
  bookingId: string;
  trackingToken: string;
  expiresInSeconds: number;
  developmentOtp?: string;
};

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
  bookingId: string;
  trackingToken: string;
  holdExpiresAt: string;
};

export async function checkAvailability(
  date: string,
  slot: BookingSlot
) {
  const response = await api.get<AvailabilityResponse>(
    "/bookings/availability",
    { params: { date, slot } }
  );

  return response.data;
}

export async function estimateBooking(data: {
  eventTypeKey: string;
  packKey: string;
  womenGuests: number;
  menGuests: number;
  slot: BookingSlot;
  pricingMarket: "RESIDENT" | "DIASPORA";
  optionKeys: string[];
  eventDate: string;
}) {
  const response = await api.post<EstimateResponse>("/bookings/estimate", data);
  return response.data;
}

export async function createGuestDraft(data: {
  eventDate: string;
  slot: BookingSlot;
  eventTypeKey: string;
  packKey: string;
  womenGuests: number;
  menGuests: number;
  phone: string;
  pricingMarket: "RESIDENT" | "DIASPORA";
  optionKeys: string[];
}) {
  const response = await api.post<GuestDraftResponse>("/bookings/draft", data);
  return response.data;
}

export async function verifyGuestOtp(bookingId: string, code: string) {
  const response = await api.post<VerifyOtpResponse>(
    `/bookings/${bookingId}/verify-otp`,
    { code }
  );

  return response.data;
}

export type GuestTrackingResponse = {
  success: boolean;
  booking: {
    id: string;
    eventDate: string;
    slot: string;
    eventTypeKey: string;
    packKey: string;
    womenGuests: number;
    menGuests: number;
    totalDZD: number;
    depositDZD: number;
    currency: "DZD" | "EUR" | "USD";
    status: string;
    holdExpiresAt?: string;
    createdAt: string;
  };
};

export async function getGuestTracking(token: string) {
  const response = await api.get<GuestTrackingResponse>(
    `/bookings/tracking/${token}`
  );

  return response.data;
}

export async function resendGuestOtp(bookingId: string) {
  const response = await api.post(
    `/bookings/${bookingId}/otp/resend`
  );

  return response.data as {
    success: boolean;
    message: string;
    expiresInSeconds?: number;
    developmentOtp?: string;
  };
}

export async function saveMyBookingDraft(data: {
  eventDate: string;
  slot: BookingSlot;
  eventTypeKey: string;
  packKey: string;
  womenGuests: number;
  menGuests: number;
  pricingMarket: "RESIDENT" | "DIASPORA";
  spaceKey?: string | null;
  optionKeys: string[];
}) {
  const response = await api.post("/bookings/my/drafts", data);
  return response.data;
}