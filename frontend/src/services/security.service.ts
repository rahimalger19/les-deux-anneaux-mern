import { api } from "../api/client";

export type ClientSession = {
  id: string;
  userAgent: string;
  lastSeenAt: string;
  createdAt: string;
  current: boolean;
};

export async function getMySessions() {
  const response = await api.get<{
    success: boolean;
    sessions: ClientSession[];
  }>("/security/sessions");

  return response.data.sessions;
}

export async function revokeMySession(sessionId: string) {
  const response = await api.delete(`/security/sessions/${sessionId}`);
  return response.data;
}

export async function changeMyPassword(
  currentPassword: string,
  newPassword: string
) {
  const response = await api.patch("/security/password", {
    currentPassword,
    newPassword,
  });

  return response.data;
}

export async function requestPhoneChangeOtp(newPhone: string) {
  const response = await api.post<{
    success: boolean;
    message: string;
    developmentOtp?: string;
  }>("/security/phone/request-otp", {
    newPhone,
  });

  return response.data;
}

export async function confirmPhoneChange(code: string) {
  const response = await api.post("/security/phone/confirm", {
    code,
  });

  return response.data;
}

export async function updateMyTwoFactor(enabled: boolean) {
  const response = await api.patch<{
    success: boolean;
    message: string;
    twoFactorEnabled: boolean;
  }>("/security/two-factor", {
    enabled,
  });

  return response.data;
}