import type { Request, Response } from "express";
import { AnalyticsEvent } from "../models/AnalyticsEvent";

const funnelSteps = [
  "PAGE_VIEW",
  "RESERVATION_ESTIMATE",
  "BOOKING_DRAFT_CREATED",
  "OTP_VERIFIED",
] as const;

export async function getSuperTracking(
  _req: Request,
  res: Response
) {
  try {
    const [
      funnelRows,
      utmRows,
      journeyRows,
      deviceRows,
      countryRows,
      ipRows,
    ] = await Promise.all([
      AnalyticsEvent.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]),

      AnalyticsEvent.aggregate([
        {
          $match: {
            utmSource: { $exists: true, $ne: "" },
          },
        },
        {
          $group: {
            _id: {
              source: "$utmSource",
              medium: { $ifNull: ["$utmMedium", ""] },
              campaign: { $ifNull: ["$utmCampaign", ""] },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),

      AnalyticsEvent.aggregate([
        {
          $group: {
            _id: {
              $ifNull: [
                "$journey",
                {
                  $cond: [
                    { $ne: ["$userId", null] },
                    "ACCOUNT",
                    "GUEST",
                  ],
                },
              ],
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      AnalyticsEvent.aggregate([
        {
          $group: {
            _id: "$device",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      AnalyticsEvent.aggregate([
        {
          $match: {
            country: { $exists: true, $ne: "" },
          },
        },
        {
          $group: {
            _id: "$country",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),

      AnalyticsEvent.aggregate([
        {
          $match: {
            ip: { $exists: true, $ne: "" },
          },
        },
        {
          $group: {
            _id: "$ip",
            count: { $sum: 1 },
            lastSeenAt: { $max: "$createdAt" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    const counts = new Map<string, number>(
      (funnelRows as Array<{ _id: string; count: number }>).map(
        (row) => [row._id, row.count]
      )
    );

    let previousCount: number | null = null;

    const funnel = funnelSteps.map((type) => {
      const count = counts.get(type) || 0;

      const conversionFromPrevious =
        previousCount === null || previousCount === 0
          ? null
          : Math.round((count / previousCount) * 1000) / 10;

      previousCount = count;

      return {
        type,
        count,
        conversionFromPrevious,
      };
    });

    return res.json({
      success: true,
      funnel,
      utm: (utmRows as any[]).map((row) => ({
        source: row._id.source,
        medium: row._id.medium || "—",
        campaign: row._id.campaign || "—",
        count: row.count,
      })),
      journeys: (journeyRows as any[]).map((row) => ({
        journey: row._id,
        count: row.count,
      })),
      devices: (deviceRows as any[]).map((row) => ({
        device: row._id || "Unknown",
        count: row.count,
      })),
      countries: (countryRows as any[]).map((row) => ({
        country: row._id,
        count: row.count,
      })),
      ips: (ipRows as any[]).map((row) => ({
        ip: row._id,
        count: row.count,
        lastSeenAt: row.lastSeenAt,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load tracking data",
    });
  }
}