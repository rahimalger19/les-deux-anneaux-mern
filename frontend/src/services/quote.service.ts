import { api } from "../api/client";
import type { BookingSlot } from "../types/booking.types";

export type Quote = {
  id: string;
  eventTypeKey: string;
  packKey: string;
  slot: BookingSlot;
  womenGuests: number;
  menGuests: number;
  totalDZD: number;
  depositDZD: number;
  status: string;
  customRequest?: string;
  createdAt: string;
  pricingMarket: "RESIDENT" | "DIASPORA";
};

export async function getMyQuotes() {
  const response = await api.get<{
    success: boolean;
    quotes: Quote[];
  }>("/quotes/my");

  return response.data.quotes;
}

export async function createQuote(data: {
  eventTypeKey: string;
  packKey: string;
  slot: BookingSlot;
  womenGuests: number;
  menGuests: number;
  customRequest?: string;
  pricingMarket: "RESIDENT" | "DIASPORA";
}) {
  const response = await api.post("/quotes", data);
  return response.data;
}