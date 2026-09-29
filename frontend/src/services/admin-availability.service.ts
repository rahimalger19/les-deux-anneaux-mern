import { api } from "../api/client";

export type AvailabilityBlockType =
  | "MAINTENANCE"
  | "MANUAL"
  | "PREPARATION_BUFFER";

export type BookingSlot = "AFTERNOON" | "EVENING" | "NIGHT" | "DAY";

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

export type CalendarBooking = {
  id: string;
  eventDate: string;
  slot: BookingSlot;
  eventTypeKey: string;
  status: BookingStatus;
  womenGuests: number;
  menGuests: number;
  holdExpiresAt?: string;
};

export type AvailabilityBlock = {
  id: string;
  eventDate: string;
  slots: BookingSlot[];
  type: AvailabilityBlockType;
  reason?: string;
};

export async function getAdminCalendar(
  from: string,
  to: string,
  space = "main-hall"
) {
  const response = await api.get<{
    success: boolean;
    bookings: CalendarBooking[];
    blocks: AvailabilityBlock[];
  }>("/admin/availability/calendar", {
    params: { from, to, space },
  });

  return response.data;
}

export async function getAdminAvailability(
  from: string,
  to: string
) {
  const data = await getAdminCalendar(from, to);
  return data.blocks;
}

export async function createAvailabilityBlocks(data: {
  type: AvailabilityBlockType;
  reason?: string;
  spaceKey?: string;
  blocks: Array<{
    eventDate: string;
    slot: BookingSlot;
  }>;
}) {
  const response = await api.post("/admin/availability/blocks", data);
  return response.data;
}

export const createAdminAvailabilityBlocks = createAvailabilityBlocks;

export async function deleteAvailabilityBlock(blockId: string) {
  const response = await api.delete(
    `/admin/availability/blocks/${blockId}`
  );

  return response.data;
}

export const deleteAdminAvailabilityBlock = deleteAvailabilityBlock;