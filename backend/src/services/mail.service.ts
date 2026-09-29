import nodemailer from "nodemailer";
import mjml2html from "mjml";
import {
  EMAIL_TEMPLATE_KEYS,
  EmailTemplate,
  type EmailTemplateKey,
  type EmailTemplateLanguage,
} from "../models/EmailTemplate";
import { EmailLog } from "../models/EmailLog";

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const defaults: Record<
  EmailTemplateKey,
  { subject: string; content: string }
> = {
  NEWSLETTER_CONFIRMATION: {
    subject: "Confirmez votre inscription - Les Deux Anneaux",
    content:
      "<p>Merci pour votre inscription.</p><p><a href=\"{{confirmationUrl}}\">Confirmer mon inscription</a></p>",
  },
  PASSWORD_RESET: {
    subject: "Réinitialisation de votre mot de passe",
    content:
      "<p>Vous avez demandé une réinitialisation de mot de passe.</p><p><a href=\"{{resetUrl}}\">Réinitialiser mon mot de passe</a></p>",
  },
  PROFORMA: {
    subject: "Pro forma {{proFormaNumber}} - Les Deux Anneaux",
    content:
      "<p>Bonjour,</p><p>Votre pro forma <strong>{{proFormaNumber}}</strong> est disponible.</p><p><a href=\"{{downloadUrl}}\">Ouvrir le pro forma</a></p>",
  },
  CONTACT_REPLY: {
    subject: "Re: {{subject}} - Les Deux Anneaux",
    content:
      "<p>Bonjour {{recipientName}},</p><p>{{replyText}}</p><p>Les Deux Anneaux</p>",
  },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderSubject(
  content: string,
  values: Record<string, string>
) {
  return content.replace(/\{\{([a-zA-Z0-9]+)\}\}/g, (_match, key) =>
    String(values[key] || "").replace(/[\r\n]+/g, " ")
  );
}

function renderHtml(
  content: string,
  values: Record<string, string>
) {
  return content.replace(
    /\{\{([a-zA-Z0-9]+)\}\}/g,
    (_match, key) =>
      escapeHtml(values[key] || "").replace(/\r?\n/g, "<br />")
  );
}

function toPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

async function compileTemplate(
  content: string,
  format: "HTML" | "MJML"
) {
  if (format === "HTML") {
    return content;
  }

  const result = await mjml2html(content);

  if (result.errors.length > 0) {
    throw new Error("Invalid MJML template");
  }

  return result.html;
}

export async function ensureEmailTemplates() {
  const emailTemplateModel: any = EmailTemplate;

  await Promise.all(
    EMAIL_TEMPLATE_KEYS.flatMap((key) =>
      (["fr", "ar", "en"] as const).map((language) =>
        emailTemplateModel.updateOne(
          { key, language },
          {
            $setOnInsert: {
              key,
              language,
              subject: defaults[key].subject,
              content: defaults[key].content,
              format: "HTML",
            },
          },
          { upsert: true }
        )
      )
    )
  );
}

async function sendTemplateEmail(data: {
  key: EmailTemplateKey;
  to: string;
  language?: EmailTemplateLanguage;
  values: Record<string, string>;
}) {
  await ensureEmailTemplates();

  const language = data.language || "fr";
  const template = await EmailTemplate.findOne({
    key: data.key,
    language,
  }).lean();

  if (!template) {
    throw new Error("Email template not found");
  }

  const subject = renderSubject(template.subject, data.values);
  const renderedContent = renderHtml(template.content, data.values);
  const html = await compileTemplate(
  renderedContent,
  template.format
);

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: data.to,
      subject,
      text: toPlainText(html),
      html,
    });

    await EmailLog.create({
      to: data.to,
      subject,
      templateKey: data.key,
      language,
      status: "SENT",
    });
  } catch (error) {
    await EmailLog.create({
      to: data.to,
      subject,
      templateKey: data.key,
      language,
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unknown email error",
    });

    throw error;
  }
}

export function getSmtpStatus() {
  return {
    hostConfigured: Boolean(process.env.SMTP_HOST?.trim()),
    port: smtpPort,
    authConfigured: Boolean(
      process.env.SMTP_USER?.trim() && process.env.SMTP_PASSWORD?.trim()
    ),
    fromConfigured: Boolean(process.env.SMTP_FROM?.trim()),
  };
}

export async function sendSmtpTestEmail(to: string) {
  const subject = "Test SMTP - Les Deux Anneaux";

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: "Configuration SMTP valide.",
      html: "<p>Configuration SMTP valide.</p>",
    });

    await EmailLog.create({
      to,
      subject,
      status: "SENT",
    });
  } catch (error) {
    await EmailLog.create({
      to,
      subject,
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unknown email error",
    });

    throw error;
  }
}

export async function sendNewsletterConfirmationEmail(
  email: string,
  confirmationToken: string,
  language: EmailTemplateLanguage = "fr"
) {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is missing");
  }

  await sendTemplateEmail({
    key: "NEWSLETTER_CONFIRMATION",
    to: email,
    values: {
      confirmationUrl: `${frontendUrl}/newsletter?token=${confirmationToken}`,
    },
    language,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
) {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is missing");
  }

  await sendTemplateEmail({
    key: "PASSWORD_RESET",
    to: email,
    values: {
      resetUrl: `${frontendUrl}/mot-de-passe-oublie?token=${token}`,
    },
  });
}

export async function sendProFormaEmail(
  email: string,
  proFormaNumber: string,
  downloadUrl: string
) {
  await sendTemplateEmail({
    key: "PROFORMA",
    to: email,
    values: {
      proFormaNumber,
      downloadUrl,
    },
  });
}

export async function sendContactReplyEmail(data: {
  to: string;
  recipientName: string;
  subject: string;
  replyText: string;
  language?: "fr-DZ" | "ar-DZ" | "en";
}) {
  const language =
    data.language === "ar-DZ"
      ? "ar"
      : data.language === "en"
        ? "en"
        : "fr";

  await sendTemplateEmail({
    key: "CONTACT_REPLY",
    to: data.to,
    language,
    values: {
      recipientName: data.recipientName,
      subject: data.subject,
      replyText: data.replyText,
    },
  });
}

export async function sendNewsletterCampaignEmail(data: {
  to: string;
  subject: string;
  html: string;
  unsubscribeToken: string;
}) {
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, "");

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is missing");
  }

  const unsubscribeUrl =
    `${frontendUrl}/newsletter?unsubscribe=${data.unsubscribeToken}`;

  const html = `
    ${data.html}
    <hr />
    <p style="font-size: 12px; color: #666;">
      <a href="${unsubscribeUrl}">Se désabonner de la newsletter</a>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: data.to,
      subject: data.subject,
      text: toPlainText(html),
      html,
    });

    await EmailLog.create({
      to: data.to,
      subject: data.subject,
      status: "SENT",
    });
  } catch (error) {
    await EmailLog.create({
      to: data.to,
      subject: data.subject,
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unknown email error",
    });

    throw error;
  }
}