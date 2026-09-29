import { api } from "../api/client";

export type AdminPayment = {
  id: string;
  method: "CCP" | "BARIDIMOB" | "VIREMENT";
  amountDZD: number;
  reference?: string;
  proofFileName?: string;
  proofMimeType?: string;
  createdAt: string;
  booking: {
    id: string;
    eventDate: string;
    slot: string;
    eventTypeKey: string;
    guestPhone?: string;
    depositDZD: number;
    status: string;
  } | null;
};

export async function getPendingProofPayments() {
  const response = await api.get<{
    success: boolean;
    payments: AdminPayment[];
  }>("/payments/admin/pending");

  return response.data.payments;
}

export async function validatePayment(
  paymentId: string,
  reference: string
) {
  return api.patch(`/payments/admin/${paymentId}/validate`, {
    reference,
  });
}

export async function rejectPayment(
  paymentId: string,
  rejectionReason: string
) {
  return api.patch(`/payments/admin/${paymentId}/reject`, {
    rejectionReason,
  });
}

export async function getAdminPaymentProof(paymentId: string) {
  return api.get<Blob>(`/payments/admin/${paymentId}/proof`, {
    responseType: "blob",
  });
}