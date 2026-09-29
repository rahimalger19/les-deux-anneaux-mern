import { api } from "../api/client";

export type DayOfBooking = {
  id: string;
  eventDate: string;
  slot: string;
  eventTypeKey: string;
  womenGuests: number;
  menGuests: number;
  status: string;
  client: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  hasPlan: boolean;
  planUpdatedAt: string | null;
};

export type DayOfStaffMember = {
  id: string;
  name: string;
  role: "RECEPTION" | "MANAGER" | "COMPTA";
};

export type RunSheetEntry = {
  time: string;
  dayOffset: 0 | 1;
  label: string;
  staffUserId?: string;
  notes?: string;
};

export type DayOfPlan = {
  booking: DayOfBooking;
  staffMembers: DayOfStaffMember[];
  plan: {
    entries: RunSheetEntry[];
    updatedAt: string | null;
  };
};

export async function getDayOfBookings() {
  const response = await api.get<{
    success: boolean;
    bookings: DayOfBooking[];
  }>("/admin/day-of");

  return response.data.bookings;
}

export async function getDayOfPlan(bookingId: string) {
  const response = await api.get<
    { success: boolean } & DayOfPlan
  >(`/admin/day-of/${bookingId}`);

  return {
    booking: response.data.booking,
    staffMembers: response.data.staffMembers,
    plan: response.data.plan,
  };
}

export async function saveDayOfPlan(
  bookingId: string,
  entries: RunSheetEntry[]
) {
  const response = await api.put(`/admin/day-of/${bookingId}`, {
    entries,
  });

  return response.data as {
    success: boolean;
    message: string;
    planUpdatedAt: string | null;
  };
}