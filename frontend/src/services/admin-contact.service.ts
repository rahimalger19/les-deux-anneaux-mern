import { api } from "../api/client";

export type ContactStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "ARCHIVED";

export type ContactAgent = {
  id: string;
  name: string;
  email: string;
  role: "RECEPTION" | "MANAGER";
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ContactAssignee = ContactAgent;

export type AdminContactMessage = {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  language: "fr-DZ" | "ar-DZ" | "en";
  callbackSlot: string;
  source: string;
  requestType: "GENERAL" | "APPOINTMENT";
  requestedAppointmentType?: "VISIT" | "VIDEO";
  requestedAppointmentSlot?: "DAY" | "EVENING" | "NIGHT";
  status: ContactStatus;
  createdAt: string;
  assignedTo: ContactAssignee | null;
  replyText: string;
  repliedAt: string | null;
  repliedBy: ContactAssignee | null;
};

type ContactListResponse = {
  success: boolean;
  messages: AdminContactMessage[];
  agents: ContactAgent[];
  pagination: Pagination;
};
export async function getAdminContactMessages(params?: {
  status?: ContactStatus;
  assignedTo?: string;
  requestType?: "GENERAL" | "APPOINTMENT";
  page?: number;
  limit?: number;
}) {
  const response = await api.get<ContactListResponse>(
    "/admin/communication/messages",
    { params }
  );

  return response.data;
}

export async function updateAdminContactMessage(
  messageId: string,
  data: {
    status?: ContactStatus;
    assignedTo?: string;
  }
) {
  const response = await api.patch(
    `/admin/communication/messages/${messageId}/status`,
    data
  );

  return response.data as {
    success: boolean;
    message: string;
  };
}

export async function replyToAdminContactMessage(
  messageId: string,
  replyText: string
) {
  const response = await api.post(
    `/admin/communication/messages/${messageId}/reply`,
    { replyText }
  );

  return response.data as {
    success: boolean;
    message: string;
  };
}