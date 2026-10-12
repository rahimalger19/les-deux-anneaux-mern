import { api } from "../api/client";
import type {
  Payment,
  PaymentInstructions,
  PaymentMethod,
} from "../types/payment.types";

export async function createPayment(
  trackingToken: string,
  method: PaymentMethod
) {
  const response = await api.post(
    `/payments/tracking/${trackingToken}`,
    { method }
  );

  return response.data.payment as Payment;
}

export async function getBookingPayment(trackingToken: string) {
  const response = await api.get(
    `/payments/tracking/${trackingToken}`
  );

  return response.data.payment as Payment | null;
}

export async function getPaymentInstructions(): Promise<PaymentInstructions> {
  
  const response = await api.get<{
    success: boolean;
    instructions: PaymentInstructions;
  }>("/payments/instructions");

  return response.data.instructions;
}

export async function uploadPaymentProof(
  trackingToken: string,
  file: File
) {
  const formData = new FormData();
  formData.append("proof", file);

  const response = await api.post(
    `/payments/tracking/${trackingToken}/proof`,
    formData
  );

  return response.data;
}

