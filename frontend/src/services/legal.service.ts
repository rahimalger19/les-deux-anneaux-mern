import { api } from "../api/client";

export type LocalizedText = {
  fr: string;
  ar: string;
  en: string;
};

export type LegalDocument = {
  key: string;
  title: LocalizedText;
  content: LocalizedText;
  updatedAt?: string;
};

export async function getLegalDocument(key: string) {
  const response = await api.get<{
    success: boolean;
    document: LegalDocument;
  }>(`/public/legal/${key}`);

  return response.data.document;
}