import { api } from "../api/client";

export type AdminAppointment = {
  id: string;
  source: "ACCOUNT" | "CONTACT";
  type: "VISIT" | "VIDEO";
  requestedSlot?: "DAY" | "EVENING" | "NIGHT";
  appointmentSlot?: "DAY" | "EVENING" | "NIGHT";
  scheduledAt?: string;
  timezone: string;
  notes?: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  client: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
};

export async function getAdminAppointments(params: {
  status?: string;
  date?: string;
  source?: "ACCOUNT" | "CONTACT";
}) {
  const response = await api.get<{
    success: boolean;
    appointments: AdminAppointment[];
  }>("/admin/appointments", { params });

  return response.data.appointments;
}

export async function updateAdminAppointment(
  appointmentId: string,
  data:
    | {
        action: "CONFIRM";
        scheduledAt: string;
        appointmentSlot: "DAY" | "EVENING" | "NIGHT";
      }
    | {
        action: "CANCEL";
      }
) {
  const response = await api.patch(
    `/admin/appointments/${appointmentId}`,
    data
  );

  return response.data;
}