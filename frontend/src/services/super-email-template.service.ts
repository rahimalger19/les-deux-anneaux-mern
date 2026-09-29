import { api } from "../api/client";

export type EmailTemplate = {
  id: string;
  key:
    | "NEWSLETTER_CONFIRMATION"
    | "PASSWORD_RESET"
    | "PROFORMA"
    | "CONTACT_REPLY";
  language: "fr" | "ar" | "en";
  subject: string;
  content: string;
  format: "HTML" | "MJML";
};

export type SmtpStatus = {
  hostConfigured: boolean;
  port: number;
  authConfigured: boolean;
  fromConfigured: boolean;
};

export type EmailLog = {
  id: string;
  to: string;
  subject: string;
  templateKey?: string;
  language?: string;
  status: "SENT" | "FAILED";
  error?: string;
  createdAt?: string;
};

export async function getSuperEmailTemplates() {
  const response = await api.get<{
    success: boolean;
    smtp: SmtpStatus;
    templates: EmailTemplate[];
    logs: EmailLog[];
    variables: Record<string, string[]>;
  }>("/super/smtp");

  return response.data;
}

export async function updateSuperEmailTemplate(
  key: EmailTemplate["key"],
  data: {
    language: EmailTemplate["language"];
    subject: string;
    content: string;
    format: EmailTemplate["format"];
  }
) {
  const response = await api.put(`/super/smtp/${key}`, data);
  return response.data;
}

export async function testSuperSmtp(email: string) {
  const response = await api.post("/super/smtp/test", { email });
  return response.data;
}