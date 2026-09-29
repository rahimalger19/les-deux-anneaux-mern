import { api } from "../api/client";

export type PricingRule = {
  id: string;
  market: "RESIDENT" | "DIASPORA";
  slot: "AFTERNOON" | "EVENING" | "NIGHT" | "DAY";
  season: "LOW" | "NORMAL" | "HIGH";
  dayType: "ALL" | "WEEKDAY" | "WEEKEND";
  minGuests: number;
  maxGuests: number;
  priceDZD: number;
  active: boolean;
};

export type PricingSeason = {
  id: string;
  key: "LOW" | "HIGH";
  startMonthDay: string;
  endMonthDay: string;
  priority: number;
  active: boolean;
};

export type PricingEventType = {
  id: string;
  key: string;
  name: { fr: string; ar: string; en: string };
  womenCapacity: number;
  menCapacity: number;
  allowedSlots: string[];
  durationHours: number;
  bufferMinutes?: number;
};

export async function getSuperPricing() {
  const response = await api.get<{
    success: boolean;
    pricingRules: PricingRule[];
    pricingSeasons: PricingSeason[];
    eventTypes: PricingEventType[];
  }>("/super/tarifs");

  return response.data;
}

export async function createPricingRule(data: Omit<PricingRule, "id" | "active">) {
  return api.post("/super/tarifs/rules", data);
}

export async function setPricingRuleActive(ruleId: string, active: boolean) {
  return api.patch(`/super/tarifs/rules/${ruleId}`, { active });
}

export async function deletePricingRule(ruleId: string) {
  return api.delete(`/super/tarifs/rules/${ruleId}`);
}

export async function createPricingSeason(data: Omit<PricingSeason, "id" | "active">) {
  return api.post("/super/tarifs/seasons", data);
}

export async function setPricingSeasonActive(
  seasonId: string,
  active: boolean
) {
  return api.patch(`/super/tarifs/seasons/${seasonId}`, { active });
}

export async function deletePricingSeason(seasonId: string) {
  return api.delete(`/super/tarifs/seasons/${seasonId}`);
}

export async function updateEventTypeCapacity(
  key: string,
  data: {
    womenCapacity: number;
    menCapacity: number;
    bufferMinutes: number;
    allowedSlots: string[];
  }
) {
  return api.patch(`/super/tarifs/event-types/${key}`, data);
}