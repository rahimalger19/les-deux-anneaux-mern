import type { Request, Response } from "express";
import { User } from "../models/User";

const validLanguages = ["fr-DZ", "ar-DZ", "en"];
const validCurrencies = ["DZD", "EUR", "USD"];

export async function getMyPreferences(req: Request, res: Response) {
  try {
    const user = await User.findById(req.user?.id).select(
      "language currency emailNotifications smsNotifications"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      preferences: {
        language: user.language,
        currency: user.currency,
        emailNotifications: user.emailNotifications,
        smsNotifications: user.smsNotifications,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load preferences",
    });
  }
}

export async function updateMyPreferences(req: Request, res: Response) {
  try {
    const {
      language,
      currency,
      emailNotifications,
      smsNotifications,
    } = req.body;

    if (
      !validLanguages.includes(language) ||
      !validCurrencies.includes(currency) ||
      typeof emailNotifications !== "boolean" ||
      typeof smsNotifications !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid preferences",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      {
        $set: {
          language,
          currency,
          emailNotifications,
          smsNotifications,
        },
      },
      { new: true }
    ).select(
      "language currency emailNotifications smsNotifications"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      preferences: {
        language: user.language,
        currency: user.currency,
        emailNotifications: user.emailNotifications,
        smsNotifications: user.smsNotifications,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to save preferences",
    });
  }
}