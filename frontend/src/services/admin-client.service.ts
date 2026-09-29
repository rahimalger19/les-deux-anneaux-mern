import { api } from "../api/client";

export type AdminClient = {
  id: string;
  kind: "USER" | "GUEST";
  name: string;
  email: string | null;
  phone: string | null;
  bookingCount: number;
  diaspora: boolean;
  lastBookingAt: string | null;
};

export type AdminClientBooking = {
  id: string;
  eventDate: string;
  slot: string;
  eventTypeKey: string;
  packKey?: string;
  pricingMarket: "RESIDENT" | "DIASPORA";
  totalDZD: number;
  depositDZD: number;
  currency: "DZD" | "EUR" | "USD";
  status: string;
  guestPhone?: string;
  hasGuestOtp: boolean;
  createdAt: string;
};

export type AdminClientPayment = {
  id: string;
  bookingId: string;
  method: "CCP" | "BARIDIMOB" | "VIREMENT";
  amountDZD: number;
  reference?: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
  validatedAt?: string;
};

export type AdminClientAppointment = {
  id: string;
  type: "VISIT" | "VIDEO";
  source: "ACCOUNT" | "CONTACT";
  requestedSlot?: "DAY" | "EVENING" | "NIGHT";
  appointmentSlot?: "DAY" | "EVENING" | "NIGHT";
  scheduledAt?: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
};

export type AdminClientDetails = {
  client: {
    id: string;
    kind: "USER" | "GUEST";
    name: string;
    email: string | null;
    phone: string | null;
    language: string | null;
    currency: string | null;
    accountCreatedAt: string | null;
    diaspora: boolean;
  };
  bookings: AdminClientBooking[];
  payments: AdminClientPayment[];
  appointments: AdminClientAppointment[];
};

export async function getAdminClients(search?: string) {
  const response = await api.get<{
    success: boolean;
    clients: AdminClient[];
  }>("/admin/clients", {
    params: { search: search || undefined },
  });

  return response.data.clients;
}

export async function getAdminClientDetails(
  kind: "USER" | "GUEST",
  id: string
) {
  const response = await api.get<{
    success: boolean;
  } & AdminClientDetails>(
    `/admin/clients/${kind}/${encodeURIComponent(id)}`
  );

  return {
    client: response.data.client,
    bookings: response.data.bookings,
    payments: response.data.payments,
    appointments: response.data.appointments,
  };
}