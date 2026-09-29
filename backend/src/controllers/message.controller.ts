import type { Request, Response } from "express";
import { Message } from "../models/Message";
import { MessageThread } from "../models/MessageThread";
import { Notification } from "../models/Notification";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getMyThreads(req: Request, res: Response) {
  try {
    const threads = await MessageThread.find({
      userId: req.user?.id,
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    return res.json({ success: true, threads });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load messages",
    });
  }
}

export async function createMyThread(req: Request, res: Response) {
  try {
    const subject = String(req.body.subject || "").trim();
    const body = String(req.body.body || "").trim();

    if (!req.user || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    const thread = await MessageThread.create({
      userId: req.user.id,
      subject,
      lastMessageAt: new Date(),
    });

    await Message.create({
      threadId: thread._id,
      senderType: "CLIENT",
      senderId: req.user.id,
      body,
    });

    return res.status(201).json({
      success: true,
      thread,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to send message",
    });
  }
}

export async function getMyThreadMessages(req: Request, res: Response) {
  try {
    const threadId = getParam(req.params.threadId);

    const thread = await MessageThread.findOne({
      _id: threadId,
      userId: req.user?.id,
    }).lean();

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Message thread not found",
      });
    }

    const messages = await Message.find({ threadId })
      .sort({ createdAt: 1 })
      .lean();

    await Message.updateMany(
      {
        threadId,
        senderType: "HALL",
        readAt: { $exists: false },
      },
      {
        $set: { readAt: new Date() },
      }
    );

    return res.json({
      success: true,
      thread,
      messages,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load the conversation",
    });
  }
}

export async function sendMyThreadMessage(req: Request, res: Response) {
  try {
    const threadId = getParam(req.params.threadId);
    const body = String(req.body.body || "").trim();

    if (!body) {
      return res.status(400).json({
        success: false,
        message: "Message text is required",
      });
    }

    const thread = await MessageThread.findOne({
      _id: threadId,
      userId: req.user?.id,
    });

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Message thread not found",
      });
    }

    const message = await Message.create({
      threadId: thread._id,
      senderType: "CLIENT",
      senderId: req.user?.id,
      body,
    });

    thread.lastMessageAt = new Date();
    await thread.save();

    return res.status(201).json({ success: true, message });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to send message",
    });
  }
}

export async function getMyNotifications(req: Request, res: Response) {
  try {
    const notifications = await Notification.find({
      userId: req.user?.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, notifications });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load notifications",
    });
  }
}

export async function markMyNotificationRead(req: Request, res: Response) {
  try {
    const notificationId = getParam(req.params.notificationId);

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: req.user?.id,
      },
      { $set: { readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({ success: true, notification });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update notification",
    });
  }
}