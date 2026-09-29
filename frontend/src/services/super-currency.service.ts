import { api } from "../api/client";

export type ExchangeRate = {
  id: string;
  currency: "EUR" | "USD";
  dzdPerUnit: number;
  active: boolean;
};

export type DiasporaCountry = {
  id: string;
  code: string;
  name: string;
  active: boolean;
};

export type DiasporaPricingRule = {
  id: string;
  slot: string;
  season: string;
  minGuests: number;
  maxGuests: number;
  priceDZD: number;
  active: boolean;
};

export type DiasporaPack = {
  key: string;
  name: {
    fr: string;
    ar: string;
    en: string;
  };
  includedGuests: number;
  basePriceDZD?: number;
  extraGuestPriceDZD?: number;
  active: boolean;
};

export type DiasporaEventType = {
  key: string;
  name: {
    fr: string;
    ar: string;
    en: string;
  };
  depositPercent?: number;
  active: boolean;
};

export type DiasporaGrid = {
  pricingRules: DiasporaPricingRule[];
  packs: DiasporaPack[];
  eventTypes: DiasporaEventType[];
};

export async function getSuperCurrencies() {
  const response = await api.get<{
    success: boolean;
    rates: ExchangeRate[];
    countries: DiasporaCountry[];
    diasporaGrid: DiasporaGrid;
  }>("/super/devises");

  return response.data;
}

export async function saveSuperCurrencyRate(
  currency: "EUR" | "USD",
  data: {
    dzdPerUnit: number;
    active: boolean;
  }
) {
  const response = await api.put(
    `/super/devises/${currency}`,
    data
  );

  return response.data;
}

export async function createDiasporaCountry(data: {
  code: string;
  name: string;
  active: boolean;
}) {
  const response = await api.post(
    "/super/devises/countries",
    data
  );

  return response.data;
}

export async function updateDiasporaCountry(
  code: string,
  data: {
    name: string;
    active: boolean;
  }
) {
  const response = await api.put(
    `/super/devises/countries/${code}`,
    data
  );

  return response.data;
}