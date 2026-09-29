import { api } from "../api/client";

export type AdminBooking = {
  id: string;
  source: "ONLINE" | "WALK_IN";
  eventDate: string;
  slot: string;
  eventTypeKey: string;
  packKey?: string;
  pricingMarket: "RESIDENT" | "DIASPORA";
  currency: "DZD" | "EUR" | "USD";
  totalDZD: number;
  depositDZD: number;
  status: string;
  womenGuests: number;
  menGuests: number;
  guestPhone?: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  assignedAgent: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  createdAt: string;
};

export type AssignableAgent = {
  id: string;
  name: string;
  email: string;
  role: "RECEPTION" | "MANAGER";
};

export type AdminBookingPage = {
  bookings: AdminBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    eventTypes: Array<{
      key: string;
      name: {
        fr: string;
        ar: string;
        en: string;
      };
      active: boolean;
    }>;
  };
};

export async function getAdminBookings(params: {
  source?: "ONLINE" | "WALK_IN";
  eventTypeKey?: string;
  currency?: "DZD" | "EUR" | "USD";
  agent?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get<{
    success: boolean;
    bookings: AdminBooking[];
    pagination: AdminBookingPage["pagination"];
    filters: AdminBookingPage["filters"];
  }>("/admin/bookings", { params });

  return {
    bookings: response.data.bookings,
    pagination: response.data.pagination,
    filters: response.data.filters,
  };
}

export async function getAssignableAgents() {
  const response = await api.get<{
    success: boolean;
    agents: AssignableAgent[];
  }>("/admin/bookings/agents");

  return response.data.agents;
}

export type AdminBookingDetails = {
  id: string;
  source: "ONLINE" | "WALK_IN";
  eventDate: string;
  slot: "AFTERNOON" | "EVENING" | "NIGHT" | "DAY";
  eventTypeKey: string;
  packKey?: string;
  optionKeys: string[];
  womenGuests: number;
  menGuests: number;
  pricingMarket: "RESIDENT" | "DIASPORA";
  currency: "DZD" | "EUR" | "USD";
  totalDZD: number;
  depositDZD: number;
  status: string;
  holdExpiresAt?: string;
  guestPhone?: string;
  adminNotes: string;
  priceOverrideDZD?: number;
  priceOverrideReason: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  assignedAgent: AssignableAgent | null;
  proForma: {
    number: string;
    issuedAt: string;
    totalDZD: number;
    depositDZD: number;
  } | null;
};

export async function getAdminBookingDetails(bookingId: string) {
  const response = await api.get<{
    success: boolean;
    booking: AdminBookingDetails;
  }>(`/admin/bookings/${bookingId}`);

  return response.data.booking;
}

export async function updateAdminBooking(
  bookingId: string,
  data: {
    assignedAgentId?: string;
    adminNotes?: string;
    slot?: "AFTERNOON" | "EVENING" | "NIGHT" | "DAY";
    priceOverrideDZD?: number;
    priceOverrideReason?: string;
  }
) {
  const response = await api.patch(`/admin/bookings/${bookingId}`, data);
  return response.data;
}

export async function sendAdminProForma(
  bookingId: string,
  recipientEmail: string
) {
  const response = await api.post(
    `/admin/bookings/${bookingId}/proforma/send`,
    { recipientEmail }
  );

  return response.data;
}