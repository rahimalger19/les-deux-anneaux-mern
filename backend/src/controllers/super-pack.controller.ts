import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { CustomPackTemplate } from "../models/CustomPackTemplate";
import { Pack } from "../models/Pack";
import { Service } from "../models/Service";

type LocalizedText = {
  fr: string;
  ar: string;
  en: string;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function validLocalizedText(value: unknown): value is LocalizedText {
  if (!value || typeof value !== "object") {
    return false;
  }

  const localized = value as LocalizedText;

  return Boolean(
    localized.fr?.trim() &&
      localized.ar?.trim() &&
      localized.en?.trim()
  );
}

function cleanItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0
        )
        .map((item) => item.trim())
    ),
  ];
}

async function writeAudit(
  req: Request,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown>
) {
  await AuditLog.create({
    actorId: req.user?.id,
    action,
    entityType,
    entityId,
    metadata,
  });
}

async function validateDefinition(body: Record<string, unknown>) {
  const basePriceDZD = Number(body.basePriceDZD);
  const extraGuestPriceDZD = Number(body.extraGuestPriceDZD);
  const includedGuests = Number(body.includedGuests);

  const diasporaBasePriceDZD =
    body.diasporaBasePriceDZD === "" ||
    body.diasporaBasePriceDZD === undefined
      ? undefined
      : Number(body.diasporaBasePriceDZD);

  const diasporaExtraGuestPriceDZD =
    body.diasporaExtraGuestPriceDZD === "" ||
    body.diasporaExtraGuestPriceDZD === undefined
      ? undefined
      : Number(body.diasporaExtraGuestPriceDZD);

  const includedItems = cleanItems(body.includedItems);

  if (
    !validLocalizedText(body.name) ||
    !validLocalizedText(body.description) ||
    !Number.isFinite(basePriceDZD) ||
    basePriceDZD < 0 ||
    !Number.isFinite(extraGuestPriceDZD) ||
    extraGuestPriceDZD < 0 ||
    !Number.isInteger(includedGuests) ||
    includedGuests < 0 ||
    (diasporaBasePriceDZD !== undefined &&
      (!Number.isFinite(diasporaBasePriceDZD) ||
        diasporaBasePriceDZD < 0)) ||
    (diasporaExtraGuestPriceDZD !== undefined &&
      (!Number.isFinite(diasporaExtraGuestPriceDZD) ||
        diasporaExtraGuestPriceDZD < 0))
  ) {
    throw new Error("Invalid pack information");
  }

  if (includedItems.length > 0) {
    const serviceCount = await Service.countDocuments({
      key: { $in: includedItems },
      active: true,
    });

    if (serviceCount !== includedItems.length) {
      throw new Error(
        "One or more selected catalogue services are unavailable"
      );
    }
  }

  return {
    name: body.name,
    description: body.description,
    basePriceDZD,
    extraGuestPriceDZD,
    includedGuests,
    diasporaBasePriceDZD,
    diasporaExtraGuestPriceDZD,
    includedItems,
  };
}

export async function getSuperPacks(_req: Request, res: Response) {
  try {
    const [packs, services, templates] = await Promise.all([
      Pack.find().sort({ createdAt: -1 }).lean(),
      Service.find({ active: true })
        .select("key category name priceDZD")
        .sort({ category: 1, key: 1 })
        .lean(),
      CustomPackTemplate.find()
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.json({
      success: true,
      packs: packs.map((pack) => ({
        id: pack._id.toString(),
        ...pack,
      })),
      services: services.map((service) => ({
        id: service._id.toString(),
        ...service,
      })),
      templates: templates.map((template) => ({
        id: template._id.toString(),
        ...template,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load pack catalogue",
    });
  }
}

export async function createSuperPack(req: Request, res: Response) {
  try {
    const key = String(req.body.key || "").trim().toLowerCase();

    if (!/^[a-z0-9-]+$/.test(key)) {
      return res.status(400).json({
        success: false,
        message:
          "Pack key must contain lowercase letters, numbers and hyphens only",
      });
    }

    const values = await validateDefinition(req.body);
    const packModel: any = Pack;

    const pack = await packModel.create({
      key,
      ...values,
      active: true,
    });

    await writeAudit(req, "PACK_CREATED", "Pack", pack._id.toString(), {
      key,
      includedItems: values.includedItems,
    });

    return res.status(201).json({ success: true, pack });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to create pack",
    });
  }
}

export async function updateSuperPack(req: Request, res: Response) {
  try {
    const key = getParam(req.params.key);

    if (!key) {
      return res.status(400).json({
        success: false,
        message: "Pack key is required",
      });
    }

    const values = await validateDefinition(req.body);
    const packModel: any = Pack;

    const pack = await packModel.findOneAndUpdate(
      { key },
      { $set: values },
      { new: true }
    );

    if (!pack) {
      return res.status(404).json({
        success: false,
        message: "Pack not found",
      });
    }

    await writeAudit(req, "PACK_UPDATED", "Pack", pack._id.toString(), {
      key: pack.key,
      includedItems: values.includedItems,
    });

    return res.json({ success: true, pack });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to update pack",
    });
  }
}

export async function setSuperPackActive(req: Request, res: Response) {
  try {
    const key = getParam(req.params.key);

    if (!key || typeof req.body.active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Pack key and active value are required",
      });
    }

    const packModel: any = Pack;
    const pack = await packModel.findOneAndUpdate(
      { key },
      { $set: { active: req.body.active } },
      { new: true }
    );

    if (!pack) {
      return res.status(404).json({
        success: false,
        message: "Pack not found",
      });
    }

    await writeAudit(
      req,
      "PACK_STATUS_UPDATED",
      "Pack",
      pack._id.toString(),
      { key, active: pack.active }
    );

    return res.json({ success: true, pack });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update pack status",
    });
  }
}

export async function createCustomPackTemplate(
  req: Request,
  res: Response
) {
  try {
    const values = await validateDefinition(req.body);

    const template = await CustomPackTemplate.create({
      ...values,
      active: true,
      createdBy: req.user?.id,
    });

    await writeAudit(
      req,
      "CUSTOM_PACK_TEMPLATE_CREATED",
      "CustomPackTemplate",
      template._id.toString(),
      { includedItems: values.includedItems }
    );

    return res.status(201).json({ success: true, template });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create custom pack template",
    });
  }
}

export async function updateCustomPackTemplate(
  req: Request,
  res: Response
) {
  try {
    const templateId = getParam(req.params.templateId);

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    const values = await validateDefinition(req.body);
    const templateModel: any = CustomPackTemplate;

    const template = await templateModel.findByIdAndUpdate(
      templateId,
      { $set: values },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Custom pack template not found",
      });
    }

    await writeAudit(
      req,
      "CUSTOM_PACK_TEMPLATE_UPDATED",
      "CustomPackTemplate",
      template._id.toString(),
      { includedItems: values.includedItems }
    );

    return res.json({ success: true, template });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update custom pack template",
    });
  }
}

export async function setCustomPackTemplateActive(
  req: Request,
  res: Response
) {
  try {
    const templateId = getParam(req.params.templateId);

    if (!templateId || typeof req.body.active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Template ID and active value are required",
      });
    }

    const templateModel: any = CustomPackTemplate;

    const template = await templateModel.findByIdAndUpdate(
      templateId,
      { $set: { active: req.body.active } },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Custom pack template not found",
      });
    }

    await writeAudit(
      req,
      "CUSTOM_PACK_TEMPLATE_STATUS_UPDATED",
      "CustomPackTemplate",
      template._id.toString(),
      { active: template.active }
    );

    return res.json({ success: true, template });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update custom pack template status",
    });
  }
}