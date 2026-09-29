const API_URL = import.meta.env.VITE_API_URL;

export type ContactMessageStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "REPLIED"
  | "CLOSED";

export interface AdminContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
}

export interface NewsletterSubscriber {
  _id: string;
  email: string;
  subscribed: boolean;
  subscribedAt?: string;
  createdAt: string;
}

export async function getAdminContactMessages() {
  const response = await fetch(
    `${API_URL}/admin/communication/messages`,
    {
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load messages");
  }

  return data.messages as AdminContactMessage[];
}

export async function updateAdminContactMessageStatus(
  messageId: string,
  status: ContactMessageStatus
) {
  const response = await fetch(
    `${API_URL}/admin/communication/messages/${messageId}/status`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to update message");
  }

  return data.contactMessage;
}

export async function getNewsletterSubscribers() {
  const response = await fetch(
    `${API_URL}/admin/communication/newsletter-subscribers`,
    {
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load subscribers");
  }

  return data.subscribers as NewsletterSubscriber[];
}