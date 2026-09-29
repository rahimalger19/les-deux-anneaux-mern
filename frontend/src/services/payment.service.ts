import { api } from "../api/client";
import type {
  Payment,
  PaymentInstructions,
  PaymentMethod,
} from "../types/payment.types";

export async function createPayment(
  bookingId: string,
  method: PaymentMethod
) {
  const response = await api.post<{
    success: boolean;
    payment: Payment;
  }>(`/payments/${bookingId}`, {
    method,
  });

  return response.data.payment;
}

export async function getBookingPayment(
  bookingId: string
) {
  const response = await api.get<{
    success: boolean;
    payment: Payment | null;
  }>(`/payments/${bookingId}`);

  return response.data.payment;
}

export async function getPaymentInstructions() {
  const response = await api.get<{
    success: boolean;
    instructions: PaymentInstructions;
  }>("/payments/instructions");

  return response.data.instructions;
}

export async function uploadPaymentProof(
  bookingId: string,
  file: File
) {
  const formData = new FormData();

  formData.append("proof", file);

  const response = await api.post(
    `/payments/${bookingId}/proof`,
    formData
  );

  return response.data;
}