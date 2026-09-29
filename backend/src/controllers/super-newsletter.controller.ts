import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import {
  NEWSLETTER_SEGMENTS,
  NewsletterCampaign,
  type NewsletterSegment,
} from "../models/NewsletterCampaign";
import { NewsletterDelivery } from "../models/NewsletterDelivery";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber";
import { sendNewsletterCampaignEmail } from "../services/mail.service";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getSegment(value: unknown): NewsletterSegment {
  const segment = String(value || "ALL");

  return NEWSLETTER_SEGMENTS.includes(segment as NewsletterSegment)
    ? (segment as NewsletterSegment)
    : "ALL";
}

function getLanguageFilter(segment: NewsletterSegment) {
  return segment === "ALL" ? {} : { language: segment };
}

function csvCell(value: unknown) {
  const text = String(value ?? "");

  return `"${text.replace(/"/g, '""')}"`;
}

export async function getSuperNewsletter(
  req: Request,
  res: Response
) {
  try {
    const segment = getSegment(req.query.segment);
    const languageFilter = getLanguageFilter(segment);

    const [subscribers, campaigns, totalCount, confirmedCount] =
      await Promise.all([
        NewsletterSubscriber.find(languageFilter)
          .select(
            "email phone language status confirmedAt unsubscribedAt createdAt"
          )
          .sort({ createdAt: -1 })
          .lean(),

        NewsletterCampaign.find()
          .populate("createdBy", "name email")
          .sort({ createdAt: -1 })
          .lean(),

        NewsletterSubscriber.countDocuments(languageFilter),

        NewsletterSubscriber.countDocuments({
          ...languageFilter,
          status: "CONFIRMED",
        }),
      ]);

    return res.json({
      success: true,
      selectedSegment: segment,
      summary: {
        subscriberCount: totalCount,
        confirmedCount,
      },
      subscribers: (subscribers as any[]).map((subscriber) => ({
        id: subscriber._id.toString(),
        email: subscriber.email,
        phone: subscriber.phone,
        language: subscriber.language,
        status: subscriber.status,
        confirmedAt: subscriber.confirmedAt,
        unsubscribedAt: subscriber.unsubscribedAt,
        createdAt: subscriber.createdAt,
      })),
      campaigns: (campaigns as any[]).map((campaign) => ({
        id: campaign._id.toString(),
        subject: campaign.subject,
        html: campaign.html,
        segment: campaign.segment,
        status: campaign.status,
        recipientCount: campaign.recipientCount,
        sentCount: campaign.sentCount || 0,
        failedCount: campaign.failedCount || 0,
        sentAt: campaign.sentAt,
        createdAt: campaign.createdAt,
        createdBy: campaign.createdBy
          ? {
              name: campaign.createdBy.name,
              email: campaign.createdBy.email,
            }
          : null,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load newsletter administration",
    });
  }
}

export async function exportSuperNewsletterSubscribers(
  req: Request,
  res: Response
) {
  try {
    const segment = getSegment(req.query.segment);
    const languageFilter = getLanguageFilter(segment);

    const subscribers = await NewsletterSubscriber.find(languageFilter)
      .select(
        "email phone language status confirmedAt unsubscribedAt createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    const rows = [
      [
        "Email",
        "Telephone",
        "Langue",
        "Statut",
        "Confirme le",
        "Desabonne le",
        "Inscrit le",
      ],
      ...(subscribers as any[]).map((subscriber) => [
        subscriber.email,
        subscriber.phone,
        subscriber.language,
        subscriber.status,
        subscriber.confirmedAt
          ? new Date(subscriber.confirmedAt).toISOString()
          : "",
        subscriber.unsubscribedAt
          ? new Date(subscriber.unsubscribedAt).toISOString()
          : "",
        subscriber.createdAt
          ? new Date(subscriber.createdAt).toISOString()
          : "",
      ]),
    ];

    const csv = `\uFEFF${rows
      .map((row) => row.map(csvCell).join(","))
      .join("\n")}`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="newsletter-${segment}.csv"`
    );

    return res.send(csv);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to export newsletter subscribers",
    });
  }
}

export async function createSuperNewsletterCampaign(
  req: Request,
  res: Response
) {
  try {
    const subject = String(req.body.subject || "").trim();
    const html = String(req.body.html || "").trim();
    const segment = getSegment(req.body.segment);

    if (!subject || !html) {
      return res.status(400).json({
        success: false,
        message: "Campaign subject and HTML body are required",
      });
    }

    const campaign = await NewsletterCampaign.create({
      subject,
      html,
      segment,
      status: "DRAFT",
      recipientCount: 0,
      sentCount: 0,
      failedCount: 0,
      createdBy: req.user?.id,
    });

    await AuditLog.create({
      actorId: req.user?.id,
      action: "NEWSLETTER_CAMPAIGN_CREATED",
      entityType: "NewsletterCampaign",
      entityId: campaign._id.toString(),
      metadata: { subject, segment },
    });

    return res.status(201).json({
      success: true,
      campaign,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to create newsletter campaign",
    });
  }
}

export async function sendSuperNewsletterCampaign(
  req: Request,
  res: Response
) {
  try {
    const campaignId = getParam(req.params.campaignId);

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID is required",
      });
    }

    const campaign = await NewsletterCampaign.findById(campaignId);

    if (
      !campaign ||
      !["DRAFT", "PARTIAL_FAILURE"].includes(campaign.status)
    ) {
      return res.status(409).json({
        success: false,
        message: "Only a draft or partially failed campaign can be sent",
      });
    }

    campaign.status = "SENDING";
    await campaign.save();

    const subscribers = await NewsletterSubscriber.find({
      status: "CONFIRMED",
      ...getLanguageFilter(campaign.segment),
    })
      .select("email unsubscribeToken")
      .lean();

    const newsletterDeliveryModel: any = NewsletterDelivery;

    let sentCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers as any[]) {
      const previousDelivery =
        await newsletterDeliveryModel.findOne({
          campaignId: campaign._id,
          subscriberId: subscriber._id,
        });

      if (previousDelivery?.status === "SENT") {
        sentCount += 1;
        continue;
      }

      try {
        await sendNewsletterCampaignEmail({
          to: subscriber.email,
          subject: campaign.subject,
          html: campaign.html,
          unsubscribeToken: subscriber.unsubscribeToken,
        });

        await newsletterDeliveryModel.findOneAndUpdate(
          {
            campaignId: campaign._id,
            subscriberId: subscriber._id,
          },
          {
            $set: {
              email: subscriber.email,
              status: "SENT",
              error: undefined,
              sentAt: new Date(),
            },
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          }
        );

        sentCount += 1;
      } catch (error) {
        await newsletterDeliveryModel.findOneAndUpdate(
          {
            campaignId: campaign._id,
            subscriberId: subscriber._id,
          },
          {
            $set: {
              email: subscriber.email,
              status: "FAILED",
              error:
                error instanceof Error
                  ? error.message.slice(0, 500)
                  : "Unknown newsletter delivery error",
            },
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          }
        );

        failedCount += 1;
      }
    }

    campaign.recipientCount = subscribers.length;
    campaign.sentCount = sentCount;
    campaign.failedCount = failedCount;
    campaign.sentAt = new Date();
    campaign.status =
      failedCount > 0 ? "PARTIAL_FAILURE" : "SENT";

    await campaign.save();

    await AuditLog.create({
      actorId: req.user?.id,
      action: "NEWSLETTER_CAMPAIGN_SENT",
      entityType: "NewsletterCampaign",
      entityId: campaign._id.toString(),
      metadata: {
        segment: campaign.segment,
        recipientCount: campaign.recipientCount,
        sentCount,
        failedCount,
      },
    });

    return res.json({
      success: true,
      message:
        failedCount > 0
          ? "Campaign completed with delivery failures"
          : "Newsletter campaign sent",
      recipientCount: campaign.recipientCount,
      sentCount,
      failedCount,
    });
  } catch (error) {
    console.error("Send newsletter campaign error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send newsletter campaign",
    });
  }
}