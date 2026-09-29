import { api } from "../api/client";

export type SmsConfiguration = {
  provider: "TWILIO";
  enabled: boolean;
  senderLabel: string;
  otpTtlSeconds: number;
  otpTemplate: string;
};

export type SmsProviderStatus = {
  provider: "TWILIO";
  credentialsConfigured: boolean;
  senderConfigured: boolean;
  balance: number | null;
  currency: string | null;
  balanceError: string | null;
};

export type SmsLog = {
  id: string;
  provider: string;
  senderLabel: string;
  phoneMasked: string;
  status: "SENT" | "FAILED" | "SKIPPED";
  providerMessageId?: string;
  error?: string;
  createdAt?: string;
};

export async function getSuperSmsConfiguration() {
  const response = await api.get<{
    success: boolean;
    configuration: SmsConfiguration;
    providerStatus: SmsProviderStatus;
    logs: SmsLog[];
  }>("/super/sms");

  return response.data;
}

export async function updateSuperSmsConfiguration(
  configuration: SmsConfiguration
) {
  const response = await api.put("/super/sms", configuration);
  return response.data;
}