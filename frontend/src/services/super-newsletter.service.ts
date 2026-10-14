import { api } from "../api/client";

export type NewsletterSegment =
  | "ALL"
  | "fr-DZ"
  | "ar-DZ"
  | "en";

export type NewsletterSubscriber = {
  id: string;
  email: string;
  phone: string;
  language: "fr-DZ" | "ar-DZ" | "en";
  status: "PENDING" | "CONFIRMED" | "UNSUBSCRIBED";
  confirmedAt?: string;
  unsubscribedAt?: string;
  createdAt?: string;
};

export type NewsletterCampaign = {
  id: string;
  subject: string;
  html: string;
  segment: NewsletterSegment;
  status: "DRAFT" | "SENDING" | "SENT" | "PARTIAL_FAILURE";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt?: string;
  createdAt?: string;
};

export async function getSuperNewsletter(
  segment: NewsletterSegment,
  page = 1
) {
  const response = await api.get("/super/newsletter", {
    params: { segment, page, limit: 20 },
  });

  return response.data as {
    success: boolean;
    selectedSegment: NewsletterSegment;
    summary: {
      subscriberCount: number;
      confirmedCount: number;
    };
    pagination: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
    subscribers: NewsletterSubscriber[];
    campaigns: NewsletterCampaign[];
  };
}

export async function exportSuperNewsletterSubscribers(
  segment: NewsletterSegment
) {
  const response = await api.get("/super/newsletter/export", {
    params: { segment },
    responseType: "blob",
  });

  return response.data as Blob;
}

export async function createSuperNewsletterCampaign(data: {
  subject: string;
  html: string;
  segment: NewsletterSegment;
}) {
  const response = await api.post(
    "/super/newsletter/campaigns",
    data
  );

  return response.data;
}

export async function sendSuperNewsletterCampaign(
  campaignId: string
) {
  const response = await api.post(
    `/super/newsletter/campaigns/${campaignId}/send`
  );

  return response.data;
}