import mongoose from "mongoose";
import type { Request, Response } from "express";
import {
  CONTACT_REQUEST_TYPES,
  CONTACT_STATUSES,
  ContactMessage,
} from "../models/ContactMessage";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { sendContactReplyEmail } from "../services/mail.service";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasBodyField(body: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(body, key);
}


export async function listContactMessages(req: Request, res: Response) {
  try {
    const status = String(req.query.status || "");
    const assignedTo = String(req.query.assignedTo || "");
    const requestType = String(req.query.requestType || "");

    // Pagination
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (CONTACT_STATUSES.includes(status as any)) {
      filter.status = status;
    }

    if (CONTACT_REQUEST_TYPES.includes(requestType as any)) {
      filter.requestType = requestType;
    }

    if (assignedTo === "unassigned") {
      filter.$or = [
        { assignedTo: { $exists: false } },
        { assignedTo: null },
      ];
    } else if (assignedTo) {
      if (!mongoose.isValidObjectId(assignedTo)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assigned agent",
        });
      }

      filter.assignedTo = assignedTo;
    }

    const [messages, agents, total] = await Promise.all([
      ContactMessage.find(filter)
        .populate("assignedTo", "name email role")
        .populate("repliedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.find({
        role: { $in: ["RECEPTION", "MANAGER"] },
      })
        .select("name email role")
        .sort({ name: 1 })
        .lean(),

      ContactMessage.countDocuments(filter),
    ]);

    return res.json({
      success: true,

      messages: (messages as any[]).map((message) => ({
        id: message._id.toString(),
        name: message.name,
        phone: message.phone,
        email: message.email,
        subject: message.subject,
        message: message.message,
        language: message.language,
        callbackSlot: message.callbackSlot,
        source: message.source,
        requestType: message.requestType || "GENERAL",
        requestedAppointmentType: message.requestedAppointmentType,
        requestedAppointmentSlot: message.requestedAppointmentSlot,
        status: message.status,
        createdAt: message.createdAt,

        assignedTo: message.assignedTo
          ? {
              id: message.assignedTo._id.toString(),
              name: message.assignedTo.name,
              email: message.assignedTo.email,
              role: message.assignedTo.role,
            }
          : null,

        replyText: message.replyText || "",
        repliedAt: message.repliedAt || null,

        repliedBy: message.repliedBy
          ? {
              id: message.repliedBy._id.toString(),
              name: message.repliedBy.name,
              email: message.repliedBy.email,
              role: message.repliedBy.role,
            }
          : null,
      })),

      agents: agents.map((agent) => ({
        id: agent._id.toString(),
        name: agent.name,
        email: agent.email,
        role: agent.role,
      })),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("List contact messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load contact messages",
    });
  }
}


export async function updateContactMessageStatus(
  req: Request,
  res: Response
) {
  try {
    const messageId = getParam(req.params.messageId);

    if (!messageId || !mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid message ID is required",
      });
    }

    const body = req.body as Record<string, unknown>;
    const set: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};
    const changes: Record<string, unknown> = {};

    if (hasBodyField(body, "status")) {
      const status = String(body.status || "");

      if (!CONTACT_STATUSES.includes(status as any)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contact message status",
        });
      }

      set.status = status;
      changes.status = status;
    }

    if (hasBodyField(body, "assignedTo")) {
      const assignedTo = String(body.assignedTo || "").trim();

      if (!assignedTo) {
        unset.assignedTo = 1;
        changes.assignedTo = null;
      } else {
        if (!mongoose.isValidObjectId(assignedTo)) {
          return res.status(400).json({
            success: false,
            message: "Invalid assigned agent",
          });
        }

        const agent = await User.findOne({
          _id: assignedTo,
          role: { $in: ["RECEPTION", "MANAGER"] },
        }).select("_id");

        if (!agent) {
          return res.status(400).json({
            success: false,
            message: "Assigned agent must be reception or manager",
          });
        }

        set.assignedTo = agent._id;
        changes.assignedTo = agent._id.toString();
      }
    }

    if (Object.keys(set).length === 0 && Object.keys(unset).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid update was supplied",
      });
    }

    const update: Record<string, unknown> = {};

    if (Object.keys(set).length > 0) {
      update.$set = set;
    }

    if (Object.keys(unset).length > 0) {
      update.$unset = unset;
    }

    const message = await ContactMessage.findByIdAndUpdate(
      messageId,
      update,
      { returnDocument: "after" }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await AuditLog.create({
      actorId: req.user?.id,
      action: "CONTACT_MESSAGE_UPDATED",
      entityType: "ContactMessage",
      entityId: message._id.toString(),
      metadata: changes,
    });

    return res.json({
      success: true,
      message: "Contact message updated",
    });
  } catch (error) {
    console.error("Update contact message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update contact message",
    });
  }
}

export async function replyToContactMessage(
  req: Request,
  res: Response
) {
  try {
    const messageId = getParam(req.params.messageId);
    const replyText = String(req.body.replyText || "").trim();

    if (!messageId || !mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid message ID is required",
      });
    }

    if (replyText.length < 2 || replyText.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Reply must contain between 2 and 3000 characters",
      });
    }

    const message = await ContactMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.status === "ARCHIVED") {
      return res.status(409).json({
        success: false,
        message: "An archived message cannot receive a reply",
      });
    }

    if (message.repliedAt) {
      return res.status(409).json({
        success: false,
        message: "A reply has already been sent for this message",
      });
    }

    if (!isValidEmail(message.email)) {
      return res.status(400).json({
        success: false,
        message: "The contact email is invalid",
      });
    }

    await sendContactReplyEmail({
      to: message.email,
      recipientName: message.name,
      subject: message.subject,
      replyText,
      language: message.language,
    });

    message.replyText = replyText;
    message.repliedAt = new Date();
    message.repliedBy = req.user?.id as any;
    message.assignedTo = req.user?.id as any;
    message.status = "RESOLVED";
    await message.save();

    await AuditLog.create({
      actorId: req.user?.id,
      action: "CONTACT_MESSAGE_REPLIED",
      entityType: "ContactMessage",
      entityId: message._id.toString(),
      metadata: {
        status: "RESOLVED",
        replyLength: replyText.length,
      },
    });

    return res.json({
      success: true,
      message: "Reply sent and contact resolved",
    });
  } catch (error) {
    console.error("Reply to contact message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send reply",
    });
  }
}

export async function listNewsletterSubscribers(
  _req: Request,
  res: Response
) {
  try {
    const subscribers = await NewsletterSubscriber.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      subscribers,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load newsletter subscribers",
    });
  }
}

export async function exportContactMessages(
  _req: Request,
  res: Response
) {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .lean();

    function csvCell(value: unknown) {
      let text = String(value ?? "");

      if (/^[=+\-@]/.test(text)) {
        text = `'${text}`;
      }

      return `"${text.replace(/"/g, '""')}"`;
    }

    const rows = [
      [
        "Date",
        "Nom",
        "Telephone",
        "Email",
        "Sujet",
        "Message",
        "Langue",
        "Type",
        "Statut",
      ],
      ...messages.map((message) => [
        message.createdAt
          ? new Date(message.createdAt).toISOString()
          : "",
        message.name,
        message.phone,
        message.email,
        message.subject,
        message.message,
        message.language,
        message.requestType,
        message.status,
      ]),
    ];

    const csv = `\uFEFF${rows
      .map((row) => row.map(csvCell).join(","))
      .join("\n")}`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="messages-contact.csv"'
    );

    return res.send(csv);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to export contact messages",
    });
  }
}