import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import {
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_LANGUAGES,
  EmailTemplate,
} from "../models/EmailTemplate";
import { EmailLog } from "../models/EmailLog";
import {
  ensureEmailTemplates,
  getSmtpStatus,
  sendSmtpTestEmail,
  validateEmailTemplate,
} from "../services/mail.service";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function validLanguage(value: string) {
  return EMAIL_TEMPLATE_LANGUAGES.includes(
    value as (typeof EMAIL_TEMPLATE_LANGUAGES)[number]
  );
}

export async function getSuperEmailTemplates(
  _req: Request,
  res: Response
) {
  try {
    await ensureEmailTemplates();

    const [templates, logs] = await Promise.all([
      EmailTemplate.find().sort({ key: 1, language: 1 }).lean(),
      EmailLog.find().sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    return res.json({
      success: true,
      smtp: getSmtpStatus(),
      templates: templates.map((template) => ({
        id: template._id,
        ...template,
      })),
      logs: logs.map((log) => ({
        id: log._id,
        ...log,
      })),
      variables: {
        NEWSLETTER_CONFIRMATION: ["{{confirmationUrl}}"],
        PASSWORD_RESET: ["{{resetUrl}}"],
        PROFORMA: ["{{proFormaNumber}}", "{{downloadUrl}}"],
        CONTACT_REPLY: [
          "{{recipientName}}",
          "{{subject}}",
          "{{replyText}}",
        ],
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load SMTP configuration",
    });
  }
}

export async function updateSuperEmailTemplate(
  req: Request,
  res: Response
) {
  try {
    const key = getParam(req.params.key);
    const language = String(req.body.language || "");
    const subject = String(req.body.subject || "").trim();
    const content = String(req.body.content || "").trim();
    const format = String(req.body.format || "HTML");

    if (
      !key ||
      !EMAIL_TEMPLATE_KEYS.includes(
        key as (typeof EMAIL_TEMPLATE_KEYS)[number]
      ) ||
      !validLanguage(language) ||
      !subject ||
      !content ||
      !["HTML", "MJML"].includes(format)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid SMTP template information",
      });
    }

    const emailTemplateModel: any = EmailTemplate;
    await validateEmailTemplate(
  content,
  format as "HTML" | "MJML"
);
    const template = await emailTemplateModel.findOneAndUpdate(
      { key, language },
      {
        $set: {
          subject,
          content,
          format,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await AuditLog.create({
      actorId: req.user?.id,
      action: "SMTP_TEMPLATE_UPDATED",
      entityType: "EmailTemplate",
      entityId: template._id.toString(),
      metadata: { key, language, format },
    });

    return res.json({ success: true, template });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update SMTP template",
    });
  }
}

export async function testSuperSmtp(req: Request, res: Response) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "A valid test email is required",
      });
    }

    await sendSmtpTestEmail(email);

    await AuditLog.create({
      actorId: req.user?.id,
      action: "SMTP_TEST_EMAIL_SENT",
      entityType: "SMTP",
      entityId: email,
      metadata: {},
    });

    return res.json({
      success: true,
      message: "Test email sent",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to send SMTP test email",
    });
  }
}