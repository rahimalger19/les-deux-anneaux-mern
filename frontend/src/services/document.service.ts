import { api } from "../api/client";

export type ClientDocument = {
  bookingId: string;
  eventDate: string;
  eventTypeKey: string;
  status: string;
  proFormaNumber: string;
  invoiceNumber: string | null;
};

export async function getMyDocuments() {
  const response = await api.get<{
    success: boolean;
    documents: ClientDocument[];
  }>("/documents/my");

  return response.data.documents;
}