import { api } from "../api/client";
import type { PaymentMethod } from "./client-payment.service";

export type LocalPayer = {
  _id: string;
  name: string;
  phone: string;
  relationship: string;
  paymentMethod: PaymentMethod;
  bookingId: {
    _id: string;
    eventDate: string;
    eventTypeKey: string;
    pricingMarket: "RESIDENT" | "DIASPORA";
  };
};

export async function getMyLocalPayers() {
  const response = await api.get<{
    success: boolean;
    payers: LocalPayer[];
  }>("/local-payers/my");

  return response.data.payers;
}

export async function createMyLocalPayer(data: {
  bookingId: string;
  name: string;
  phone: string;
  relationship: string;
  paymentMethod: PaymentMethod;
}) {
  const response = await api.post("/local-payers/my", data);
  return response.data;
}

export async function removeMyLocalPayer(payerId: string) {
  const response = await api.delete(`/local-payers/my/${payerId}`);
  return response.data;
}