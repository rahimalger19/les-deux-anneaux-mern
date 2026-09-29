import type { Request, Response } from "express";
import { AnalyticsEvent } from "../models/AnalyticsEvent";

const allowedTypes = [
  "PAGE_VIEW",
  "RESERVATION_ESTIMATE",
  "BOOKING_DRAFT_CREATED",
  "OTP_VERIFIED",
] as const;

function getIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || "";
}

function maskIp(value: string) {
  const ip = value.trim();

  if (!ip) {
    return undefined;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }

  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    return `${parts.slice(0, 4).join(":")}::/64`;
  }

  return undefined;
}

function getCountry(req: Request) {
  const candidate =
    req.headers["cf-ipcountry"] ||
    req.headers["x-vercel-ip-country"] ||
    req.headers["x-country-code"];

  const country = Array.isArray(candidate)
    ? candidate[0]
    : String(candidate || "");

  return /^[a-z]{2}$/i.test(country)
    ? country.toUpperCase()
    : undefined;
}

export async function createAnalyticsEvent(
  req: Request,
  res: Response
) {
  try {
    const {
      type,
      path,
      visitorId,
      device,
      utmSource,
      utmMedium,
      utmCampaign,
    } = req.body;

    if (
      !allowedTypes.includes(
        type as (typeof allowedTypes)[number]
      ) ||
      !String(visitorId || "").trim() ||
      !String(device || "").trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid analytics event",
      });
    }

    await AnalyticsEvent.create({
      type,
      path: String(path || "").slice(0, 500) || undefined,
      visitorId: String(visitorId).trim().slice(0, 120),
      userId: req.user?.id,
      journey: req.user ? "ACCOUNT" : "GUEST",
      country: getCountry(req),
      ip: maskIp(getIp(req)),
      device: String(device).slice(0, 300),
      utmSource:
        String(utmSource || "").slice(0, 120) || undefined,
      utmMedium:
        String(utmMedium || "").slice(0, 120) || undefined,
      utmCampaign:
        String(utmCampaign || "").slice(0, 120) || undefined,
    });

    return res.status(201).json({ success: true });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to record analytics event",
    });
  }
}