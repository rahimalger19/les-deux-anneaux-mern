import { api } from "../api/client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  language: "fr-DZ" | "ar-DZ" | "en";
  currency: "DZD" | "EUR" | "USD";
  newsletterOptIn: boolean;
  twoFactorEnabled: boolean;
  role:
    | "CLIENT"
    | "RECEPTION"
    | "MANAGER"
    | "COMPTA"
    | "READONLY"
    | "SUPER_ADMIN";
};

export type EmailLoginResponse = {
  success: boolean;
  message: string;
  requiresTwoFactor: boolean;
  expiresInSeconds?: number;
  developmentOtp?: string;
};

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  language: "fr-DZ" | "ar-DZ" | "en";
  currency: "DZD" | "EUR" | "USD";
  newsletterOptIn: boolean;
}) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function loginUser(data: {
  email: string;
  password: string;
}) {
  const response = await api.post<EmailLoginResponse>("/auth/login", data);
  return response.data;
}

export async function verifyTwoFactorLogin(email: string, code: string) {
  const response = await api.post("/auth/login/two-factor/verify", {
    email,
    code,
  });

  return response.data;
}

export async function requestPhoneLoginOtp(phone: string) {
  const response = await api.post("/auth/phone-otp/request", { phone });

  return response.data as {
  success: boolean;
  message: string;
  expiresInSeconds: number;
  developmentOtp?: string;
};
}

export async function verifyPhoneLoginOtp(phone: string, code: string) {
  const response = await api.post("/auth/phone-otp/verify", {
    phone,
    code,
  });

  return response.data;
}

export async function logoutUser() {
  const response = await api.post("/auth/logout");
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get<{
    success: boolean;
    user: AuthUser;
  }>("/auth/me");

  return response.data;
}
export type PasswordResetChannel = "EMAIL" | "SMS";

export async function requestPasswordReset(data: {
  channel: PasswordResetChannel;
  email?: string;
  phone?: string;
}) {
  const response = await api.post("/auth/password-reset/request", data);

  return response.data as {
    success: boolean;
    message: string;
    expiresInSeconds?: number;
    developmentCode?: string;
  };
}

export async function resetPassword(data: {
  channel: PasswordResetChannel;
  token: string;
  newPassword: string;
  phone?: string;
}) {
  const response = await api.post("/auth/password-reset/confirm", data);
  return response.data as { success: boolean; message: string };
}