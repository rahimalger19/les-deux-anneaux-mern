import crypto from "crypto";
import type { Request, Response } from "express";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber";
import { sendNewsletterConfirmationEmail } from "../services/mail.service";

export async function subscribeNewsletter(req: Request, res: Response) {
  try {
    const { email, phone, language } = req.body;

    if (!email || !phone || !language) {
      return res.status(400).json({
        success: false,
        message: "Email, phone and language are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    const unsubscribeToken = crypto.randomBytes(32).toString("hex");

    const subscriber = await NewsletterSubscriber.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          phone: String(phone).trim(),
          language,
          status: "PENDING",
          confirmationToken,
          unsubscribeToken,
          confirmedAt: undefined,
          unsubscribedAt: undefined,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    const emailLanguage =
  language === "ar-DZ"
    ? "ar"
    : language === "en"
      ? "en"
      : "fr";

    await sendNewsletterConfirmationEmail(
  subscriber.email,
  confirmationToken,
  emailLanguage
);

    return res.status(201).json({
      success: true,
      message:
        "Un email de confirmation a été envoyé. Vérifiez votre boîte mail.",
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send confirmation email",
    });
  }
}

export async function confirmNewsletter(req: Request, res: Response) {
  try {
    const token = String(req.body.token || "");

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Confirmation token is required",
      });
    }

    const subscriber = await NewsletterSubscriber.findOneAndUpdate(
      {
        confirmationToken: token,
        status: "PENDING",
      },
      {
        $set: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
        $unset: {
          confirmationToken: 1,
        },
      },
      { new: true }
    );

    if (!subscriber) {
      return res.status(400).json({
        success: false,
        message: "Invalid or already used confirmation link",
      });
    }

    return res.json({
      success: true,
      message: "Votre inscription à la newsletter est confirmée.",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export async function unsubscribeNewsletter(req: Request, res: Response) {
  try {
    const token = String(req.body.token || "");

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Unsubscribe token is required",
      });
    }

    const subscriber = await NewsletterSubscriber.findOneAndUpdate(
      {
        unsubscribeToken: token,
        status: "CONFIRMED",
      },
      {
        $set: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!subscriber) {
      return res.status(400).json({
        success: false,
        message: "Subscription not found or already unsubscribed",
      });
    }

    return res.json({
      success: true,
      message: "Vous êtes désabonné de la newsletter.",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to unsubscribe",
    });
  }
}