import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { SmsConfiguration } from "../models/SmsConfiguration";
import { SmsLog } from "../models/SmsLog";
import { getSmsProviderStatus } from "../services/sms.service";

async function getConfiguration() {
  const smsConfigurationModel: any = SmsConfiguration;

  return smsConfigurationModel.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}

export async function getSuperSmsConfiguration(
  _req: Request,
  res: Response
) {
  try {
    const [configuration, providerStatus, logs] = await Promise.all([
      getConfiguration(),
      getSmsProviderStatus(),
      SmsLog.find().sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    return res.json({
      success: true,
      configuration,
      providerStatus,
      logs: (logs as any[]).map((log) => ({
        id: log._id.toString(),
        ...log,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load SMS configuration",
    });
  }
}

export async function updateSuperSmsConfiguration(
  req: Request,
  res: Response
) {
  try {
    const provider = String(req.body.provider || "TWILIO");
    const enabled = Boolean(req.body.enabled);
    const senderLabel = String(req.body.senderLabel || "").trim();
    const otpTtlSeconds = Number(req.body.otpTtlSeconds);
    const otpTemplate = String(req.body.otpTemplate || "").trim();

    if (
      provider !== "TWILIO" ||
      !senderLabel ||
      !Number.isInteger(otpTtlSeconds) ||
      otpTtlSeconds < 60 ||
      !otpTemplate.includes("{{code}}")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid provider, sender label, TTL of at least 60 seconds, and a template containing {{code}} are required",
      });
    }

    const smsConfigurationModel: any = SmsConfiguration;

    const configuration =
      await smsConfigurationModel.findOneAndUpdate(
        { key: "default" },
        {
          $set: {
            provider: "TWILIO",
            enabled,
            senderLabel,
            otpTtlSeconds,
            otpTemplate,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    if (!configuration) {
      return res.status(500).json({
        success: false,
        message: "Unable to save SMS configuration",
      });
    }

    await AuditLog.create({
      actorId: req.user?.id,
      action: "SMS_CONFIGURATION_UPDATED",
      entityType: "SmsConfiguration",
      entityId: configuration._id.toString(),
      metadata: {
        provider: configuration.provider,
        enabled,
        senderLabel,
        otpTtlSeconds,
      },
    });

    return res.json({
      success: true,
      configuration,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update SMS configuration",
    });
  }
}