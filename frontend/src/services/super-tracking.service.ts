import { api } from "../api/client";

export type FunnelStep = {
  type:
    | "PAGE_VIEW"
    | "RESERVATION_ESTIMATE"
    | "BOOKING_DRAFT_CREATED"
    | "OTP_VERIFIED";
  count: number;
  conversionFromPrevious: number | null;
};

export type TrackingData = {
  funnel: FunnelStep[];
  utm: Array<{
    source: string;
    medium: string;
    campaign: string;
    count: number;
  }>;
  journeys: Array<{
    journey: "GUEST" | "ACCOUNT";
    count: number;
  }>;
  devices: Array<{
    device: string;
    count: number;
  }>;
  countries: Array<{
    country: string;
    count: number;
  }>;
  ips: Array<{
    ip: string;
    count: number;
    lastSeenAt?: string;
  }>;
};

export async function getSuperTracking() {
  const response = await api.get<{
    success: boolean;
  } & TrackingData>("/super/tracking");

  return response.data;
}