import { api } from "../api/client";

export type ContactRequestType = "GENERAL" | "APPOINTMENT";

export type ContactAgent = {
  id: string;
  name: string;
  email: string;
  role: "RECEPTION" | "MANAGER";
};

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
  requestType: ContactRequestType;
  requestedAppointmentType: "VISIT" | "VIDEO" | null;
  requestedAppointmentSlot: "DAY" | "EVENING" | "NIGHT" | null;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED";
  createdAt: string;
  assignedTo: ContactAgent | null;
  replyText: string;
  repliedAt: string | null;
  repliedBy: ContactAgent | null;
};

export async function getAdminContactMessages(params: {
  status?: string;
  assignedTo?: string;
  requestType?: ContactRequestType;
}) {
  const response = await api.get<{
    success: boolean;
    messages: AdminContactMessage[];
    agents: ContactAgent[];
  }>("/admin/communication/messages", { params });

  return response.data;
}

export async function updateAdminContactMessage(
  messageId: string,
  data: {
    status?: "NEW" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED";
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