import { api } from "../api/client";

export type PaymentMethodConfiguration = {
  enabled: boolean;
  label: string;
  details: string;
};

export type PaymentConfiguration = {
  brandName: string;
  legalName: string;

  logoUrl?: string;
  logoDarkUrl?: string;

  ccpRip: string;
  nif: string;
  rc: string;
  whatsappNumber: string;
  openingHours: string;

  ccp: PaymentMethodConfiguration;
  baridiMob: PaymentMethodConfiguration;
  bankTransfer: PaymentMethodConfiguration;
};

export async function getSuperPaymentConfiguration() {
  const response = await api.get<{
    success: boolean;
    configuration: PaymentConfiguration;
  }>("/super/marque");

  return response.data.configuration;
}

export async function updateSuperPaymentConfiguration(
  configuration: PaymentConfiguration
) {
  const response = await api.put("/super/marque", configuration);
  return response.data;
}