import { api } from "../api/client";

export type AdminDashboard = {
  success: boolean;
  period: {
    today: string;
    until: string;
  };
  upcomingSlots: Array<{
    id: string;
    eventDate: string;
    slot: string;
    eventTypeKey: string;
    status: string;
    womenGuests: number;
    menGuests: number;
  }>;
  expiringHolds: Array<{
    id: string;
    eventDate: string;
    slot: string;
    eventTypeKey: string;
    holdExpiresAt?: string;
  }>;
  pendingProofs: Array<{
    id: string;
    method: string;
    amountDZD: number;
    proofFileName?: string;
    booking: {
      id: string;
      eventDate: string;
      slot: string;
      eventTypeKey: string;
    } | null;
  }>;
  todayAppointments: Array<{
    id: string;
    type: "VISIT" | "VIDEO";
    scheduledAt: string;
    status: string;
    client: {
      name: string;
      email: string;
      phone?: string;
    } | null;
  }>;
};

export async function getAdminDashboard() {
  const response = await api.get<AdminDashboard>("/admin/dashboard");
  return response.data;
}