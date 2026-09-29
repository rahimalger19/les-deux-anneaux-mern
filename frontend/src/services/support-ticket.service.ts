import { api } from "../api/client";

export type SupportTicket = {
  _id: string;
  bookingId?: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
};

export async function getMySupportTickets() {
  const response = await api.get<{
    success: boolean;
    tickets: SupportTicket[];
  }>("/support-tickets/my");

  return response.data.tickets;
}

export async function createMySupportTicket(data: {
  subject: string;
  message: string;
  bookingId?: string;
}) {
  const response = await api.post("/support-tickets/my", data);
  return response.data;
}