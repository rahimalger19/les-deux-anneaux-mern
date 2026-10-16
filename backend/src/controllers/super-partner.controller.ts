import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { Partner } from "../models/Partner";

const categories = [
  "CATERER",
  "DECOR",
  "PHOTO",
  "DJ",
  "HOTEL",
] as const;

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getPartnerValues(body: Record<string, unknown>) {
  const name = String(body.name || "").trim();
  const category = String(body.category || "");
  const logoUrl = String(body.logoUrl || "").trim();
  const websiteUrl = String(body.websiteUrl || "").trim();
  const displayOrder = Number(body.displayOrder);

  const promoCode = String(body.promoCode || "")
    .trim()
    .toUpperCase();

  if (
    !name ||
    !categories.includes(
      category as (typeof categories)[number]
    ) ||
    !isUrl(logoUrl) ||
    !isUrl(websiteUrl) ||
    !Number.isInteger(displayOrder) ||
    displayOrder < 0 ||
    (promoCode && !/^[A-Z0-9-]{3,40}$/.test(promoCode))
  ) {
    throw new Error("Invalid partner information");
  }

  return {
    name,
    category: category as
      | "CATERER"
      | "DECOR"
      | "PHOTO"
      | "DJ"
      | "HOTEL",
    logoUrl,
    websiteUrl,
    promoCode: promoCode || undefined,
    displayOrder,
  };
}

export async function getSuperPartners(
  _req: Request,
  res: Response
) {
  try {
    const partners = await Partner.find()
      .sort({ active: -1, displayOrder: 1, name: 1 })
      .lean();

    return res.json({
      success: true,
      partners: (partners as any[]).map((partner) => ({
        id: partner._id.toString(),
        ...partner,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load partners",
    });
  }
}

export async function createSuperPartner(
  req: Request,
  res: Response
) {
  try {
    const values = getPartnerValues(req.body);
    const partnerModel: any = Partner;

    const partner = await partnerModel.create({
      ...values,
      active: true,
      clickCount: 0,
    });

    await AuditLog.create({
      actorId: req.user?.id,
      action: "PARTNER_CREATED",
      entityType: "Partner",
      entityId: partner._id.toString(),
      metadata: values,
    });

    return res.status(201).json({
      success: true,
      partner,
    });
  } catch (error: any) {
    return res.status(
      error?.code === 11000 ? 409 : 400
    ).json({
      success: false,
      message:
        error?.code === 11000
          ? "This promo code is already assigned to another partner"
          : error instanceof Error
            ? error.message
            : "Unable to create partner",
    });
  }
}

export async function updateSuperPartner(
  req: Request,
  res: Response
) {
  try {
    const partnerId = getParam(req.params.partnerId);

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: "Partner ID is required",
      });
    }

    const values = getPartnerValues(req.body);
    const { promoCode, ...baseValues } = values;

    const update = promoCode
      ? {
          $set: {
            ...baseValues,
            promoCode,
          },
        }
      : {
          $set: baseValues,
          $unset: {
            promoCode: 1,
          },
        };

    const partnerModel: any = Partner;

    const partner = await partnerModel.findByIdAndUpdate(
      partnerId,
      update,
      { returnDocument: "after" }
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    await AuditLog.create({
      actorId: req.user?.id,
      action: "PARTNER_UPDATED",
      entityType: "Partner",
      entityId: partner._id.toString(),
      metadata: values,
    });

    return res.json({ success: true, partner });
  } catch (error: any) {
    return res.status(
      error?.code === 11000 ? 409 : 400
    ).json({
      success: false,
      message:
        error?.code === 11000
          ? "This promo code is already assigned to another partner"
          : error instanceof Error
            ? error.message
            : "Unable to update partner",
    });
  }
}

export async function setSuperPartnerActive(
  req: Request,
  res: Response
) {
  try {
    const partnerId = getParam(req.params.partnerId);

    if (!partnerId || typeof req.body.active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Partner ID and active value are required",
      });
    }

    const partnerModel: any = Partner;

    const partner = await partnerModel.findByIdAndUpdate(
      partnerId,
      { $set: { active: req.body.active } },
      { returnDocument: "after" }
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    await AuditLog.create({
      actorId: req.user?.id,
      action: req.body.active
        ? "PARTNER_RESTORED"
        : "PARTNER_ARCHIVED",
      entityType: "Partner",
      entityId: partner._id.toString(),
      metadata: { active: partner.active },
    });

    return res.json({ success: true, partner });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update partner",
    });
  }
}

export async function reorderSuperPartners(
  req: Request,
  res: Response
) {
  try {
  const partnerIds = Array.isArray(req.body.partnerIds)
   ? req.body.partnerIds.filter(
     (value: unknown): value is string =>
       typeof value === "string" && value.trim().length > 0 ) : [];

    if (
      partnerIds.length === 0 ||
      new Set(partnerIds).size !== partnerIds.length
    ) {
      return res.status(400).json({
        success: false,
        message: "A unique ordered list of active partner IDs is required",
      });
    }

    const partnerModel: any = Partner;

    const activePartners = await partnerModel
      .find({
        _id: { $in: partnerIds },
        active: true,
      })
      .select("_id")
      .lean();

    if (activePartners.length !== partnerIds.length) {
      return res.status(400).json({
        success: false,
        message: "Only existing active partners can be reordered",
      });
    }

    await partnerModel.bulkWrite(
      partnerIds.map( (partnerId: string, displayOrder: number) => ({
        updateOne: {
          filter: { _id: partnerId },
          update: { $set: { displayOrder } },
        },
      }))
    );

    await AuditLog.create({
      actorId: req.user?.id,
      action: "PARTNER_HOME_ORDER_UPDATED",
      entityType: "Partner",
      entityId: "home-order",
      metadata: { partnerIds },
    });

    return res.json({
      success: true,
      message: "Home page partner order updated",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to reorder partners",
    });
  }
}