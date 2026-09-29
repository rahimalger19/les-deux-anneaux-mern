import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { PaymentConfiguration } from "../models/PaymentConfiguration";

async function getConfiguration() {
  const paymentConfigurationModel: any = PaymentConfiguration;

  return paymentConfigurationModel.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

export async function getSuperPaymentConfiguration(
  _req: Request,
  res: Response
) {
  try {
    const configuration = await getConfiguration();

    return res.json({
      success: true,
      configuration,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load brand configuration",
    });
  }
}

export async function updateSuperPaymentConfiguration(
  req: Request,
  res: Response
) {
  try {
    const {
      brandName,
      legalName,
      logoUrl,
      logoDarkUrl,
      ccpRip,
      nif,
      rc,
      whatsappNumber,
      openingHours,
      ccp,
      baridiMob,
      bankTransfer,
    } = req.body;

    if (
      !String(brandName || "").trim() ||
      !String(legalName || "").trim() ||
      !ccp ||
      !baridiMob ||
      !bankTransfer
    ) {
      return res.status(400).json({
        success: false,
        message: "Brand name, legal name and payment methods are required",
      });
    }

    const paymentConfigurationModel: any = PaymentConfiguration;

    const configuration =
      await paymentConfigurationModel.findOneAndUpdate(
        { key: "default" },
        {
          $set: {
            brandName: String(brandName).trim(),
            legalName: String(legalName).trim(),
            logoUrl: String(logoUrl || "").trim() || undefined,
            logoDarkUrl: String(logoDarkUrl || "").trim() || undefined,
            ccpRip: String(ccpRip || "").trim(),
            nif: String(nif || "").trim(),
            rc: String(rc || "").trim(),
            whatsappNumber: String(whatsappNumber || "").trim(),
            openingHours: String(openingHours || "").trim(),

            ccp: {
              enabled: Boolean(ccp.enabled),
              label: String(ccp.label || "CCP").trim(),
              details: String(ccp.details || "").trim(),
            },

            baridiMob: {
              enabled: Boolean(baridiMob.enabled),
              label: String(baridiMob.label || "BaridiMob").trim(),
              details: String(baridiMob.details || "").trim(),
            },

            bankTransfer: {
              enabled: Boolean(bankTransfer.enabled),
              label: String(
                bankTransfer.label || "Virement bancaire"
              ).trim(),
              details: String(bankTransfer.details || "").trim(),
            },
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

    if (!configuration) {
      return res.status(500).json({
        success: false,
        message: "Unable to save brand configuration",
      });
    }

    await AuditLog.create({
      actorId: req.user?.id,
      action: "BRAND_PAYMENT_CONFIGURATION_UPDATED",
      entityType: "PaymentConfiguration",
      entityId: configuration._id.toString(),
      metadata: {
        enabledMethods: {
          CCP: configuration.ccp.enabled,
          BARIDIMOB: configuration.baridiMob.enabled,
          VIREMENT: configuration.bankTransfer.enabled,
        },
      },
    });

    return res.json({
      success: true,
      configuration,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update brand configuration",
    });
  }
}