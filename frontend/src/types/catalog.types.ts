export type LocalizedText = {
  fr: string;
  ar: string;
  en: string;
};

export type Slot = "AFTERNOON" | "EVENING" | "NIGHT" | "DAY";

export type EventType = {
  _id: string;
  key: string;
  name: LocalizedText;
  description: LocalizedText;
  womenCapacity: number;
  menCapacity: number;
  durationHours: number;
  allowedSlots: Slot[];
  recommendedPackKey?: string;
  depositPercent: number;
  diasporaDepositPercent?: number;
  coverImage?: string;
};

export type Pack = {
  _id: string;
  key: string;
  name: LocalizedText;
  description: LocalizedText;
  basePriceDZD: number;
  extraGuestPriceDZD: number;
  includedItems: string[];
  includedGuests: number;
  diasporaName?: LocalizedText;
diasporaDescription?: LocalizedText;
diasporaBasePriceDZD?: number;
diasporaExtraGuestPriceDZD?: number;
diasporaIncludedItems: string[];
};