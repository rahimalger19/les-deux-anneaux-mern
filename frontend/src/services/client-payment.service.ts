import { api } from "../api/client";

export type PaymentMethod = "CCP" | "BARIDIMOB" | "VIREMENT";

export type ClientPayment = {
  _id: string;
  method: PaymentMethod;
  amountDZD: number;
  reference?: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  proofFileName?: string;
  rejectionReason?: string;
  localPayerId?: {
    _id: string;
    name: string;
    phone: string;
    relationship: string;
    paymentMethod: PaymentMethod;
  } | null;
  bookingId: {
    _id: string;
    eventDate: string;
    eventTypeKey: string;
    slot: string;
    status: string;
    depositDZD: number;
  };
};

export async function getMyPayments() {
  const response = await api.get<{
    success: boolean;
    payments: ClientPayment[];
  }>("/payments/my");

  return response.data.payments;
}

export async function createMyPayment(
  bookingId: string,
  method: PaymentMethod,
  reference: string,
  localPayerId?: string
) {
  const response = await api.post(`/payments/my/${bookingId}`, {
    method,
    reference,
    localPayerId,
  });

  return response.data;
}

export async function uploadMyPaymentProof(
  bookingId: string,
  file: File
) {
  const formData = new FormData();
  formData.append("proof", file);

  const response = await api.post(
    `/payments/my/${bookingId}/proof`,
    formData
  );

  return response.data;
}