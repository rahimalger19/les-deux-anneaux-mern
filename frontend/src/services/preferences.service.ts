import { api } from "../api/client";
import type { Currency } from "../contexts/CurrencyContext";
import type { Language } from "../lib/translations";

export type ClientPreferences = {
  language: Language;
  currency: Currency;
  emailNotifications: boolean;
  smsNotifications: boolean;
};

export async function getMyPreferences() {
  const response = await api.get<{
    success: boolean;
    preferences: ClientPreferences;
  }>("/preferences/me");

  return response.data.preferences;
}

export async function updateMyPreferences(
  preferences: ClientPreferences
) {
  const response = await api.patch("/preferences/me", preferences);
  return response.data;
}