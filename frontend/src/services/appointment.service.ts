import { api } from "../api/client";

export type Appointment = {
  id: string;
  type: "VISIT" | "VIDEO";
  scheduledAt: string;
  timezone: string;
  notes?: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
};

export async function getMyAppointments() {
  const response = await api.get<{
    success: boolean;
    appointments: Appointment[];
  }>("/appointments/my");

  return response.data.appointments;
}

export async function createAppointment(data: {
  type: "VISIT" | "VIDEO";
  scheduledAt: string;
  notes?: string;
}) {
  const response = await api.post("/appointments", data);
  return response.data;
}

export async function cancelAppointment(id: string) {
  const response = await api.patch(`/appointments/${id}/cancel`);
  return response.data;
}