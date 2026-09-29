import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import type { Request, Response } from "express";
import { PhoneChangeOtp } from "../models/PhoneChangeOtp";
import { User } from "../models/User";
import { UserSession } from "../models/UserSession";

export async function getMySessions(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const sessions = await UserSession.find({
      userId: req.user.id,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastSeenAt: -1 })
      .lean();

    return res.json({
      success: true,
      sessions: sessions.map((session) => ({
        id: session._id,
        userAgent: session.userAgent || "Navigateur inconnu",
        lastSeenAt: session.lastSeenAt,
        createdAt: session.createdAt,
        current: session.sessionId === req.user?.sessionId,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load sessions",
    });
  }
}

export async function revokeMySession(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const session = await UserSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.id,
      revokedAt: { $exists: false },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (session.sessionId === req.user.sessionId) {
      return res.status(400).json({
        success: false,
        message: "Use logout to close the current session",
      });
    }

    session.revokedAt = new Date();
    await session.save();

    return res.json({
      success: true,
      message: "Session disconnected",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to revoke session",
    });
  }
}

export async function changeMyPassword(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!currentPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Current password and a new password of 8 characters are required",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    await UserSession.updateMany(
      {
        userId: user._id,
        sessionId: { $ne: req.user.sessionId },
        revokedAt: { $exists: false },
      },
      { $set: { revokedAt: new Date() } }
    );

    return res.json({
      success: true,
      message: "Password changed. Other devices have been disconnected.",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
}

export async function requestPhoneChangeOtp(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const newPhone = String(req.body.newPhone || "").trim();

    if (newPhone.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number",
      });
    }

    const alreadyUsed = await User.findOne({
      phone: newPhone,
      _id: { $ne: req.user.id },
    });

    if (alreadyUsed) {
      return res.status(409).json({
        success: false,
        message: "This phone number is already used by another account",
      });
    }

    await PhoneChangeOtp.deleteMany({
      userId: req.user.id,
      usedAt: { $exists: false },
    });

    const code = randomInt(100000, 1000000).toString();

    await PhoneChangeOtp.create({
      userId: req.user.id,
      newPhone,
      codeHash: await bcrypt.hash(code, 12),
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`Development phone-change OTP for ${newPhone}: ${code}`);

    return res.json({
      success: true,
      message: "OTP sent",
      expiresInSeconds: 300,
      ...(process.env.NODE_ENV !== "production"
        ? { developmentOtp: code }
        : {}),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to send OTP",
    });
  }
}

export async function confirmPhoneChange(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const code = String(req.body.code || "").trim();

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "Enter the 6-digit OTP",
      });
    }

    const otp = await PhoneChangeOtp.findOne({
      userId: req.user.id,
      usedAt: { $exists: false },
    }).sort({ createdAt: -1 });

    if (!otp || otp.expiresAt.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    if (otp.attempts >= 3) {
      return res.status(400).json({
        success: false,
        message: "Too many incorrect attempts",
      });
    }

    if (!(await bcrypt.compare(code, otp.codeHash))) {
      otp.attempts += 1;
      await otp.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const phoneAlreadyUsed = await User.findOne({
      phone: otp.newPhone,
      _id: { $ne: req.user.id },
    });

    if (phoneAlreadyUsed) {
      return res.status(409).json({
        success: false,
        message: "This phone number is already used by another account",
      });
    }

    await User.updateOne(
      { _id: req.user.id },
      { $set: { phone: otp.newPhone } }
    );

    otp.usedAt = new Date();
    await otp.save();

    return res.json({
      success: true,
      message: "Phone number updated",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update phone number",
    });
  }
}

export async function updateMyTwoFactor(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const enabled = Boolean(req.body.enabled);

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (enabled && !user.phone) {
      return res.status(400).json({
        success: false,
        message: "Add and confirm a phone number before enabling two-factor authentication",
      });
    }

    user.twoFactorEnabled = enabled;
    await user.save();

    return res.json({
      success: true,
      twoFactorEnabled: user.twoFactorEnabled,
      message: enabled
        ? "Two-factor authentication enabled"
        : "Two-factor authentication disabled",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update two-factor authentication",
    });
  }
}