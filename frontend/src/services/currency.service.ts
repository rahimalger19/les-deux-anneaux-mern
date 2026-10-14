import { api } from "../api/client";

export type PublicExchangeRate = {
  currency: "EUR" | "USD";
  dzdPerUnit: number;
};

export async function getPublicExchangeRates() {
  const response = await api.get<{
    success: boolean;
    rates: PublicExchangeRate[];
  }>("/currencies");

  return response.data.rates;
}