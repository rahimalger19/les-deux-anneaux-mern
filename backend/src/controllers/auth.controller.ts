import { createHash, randomBytes, randomInt, randomUUID } from "crypto";import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { LoginOtp } from "../models/LoginOtp";
import { User } from "../models/User";
import { createToken, verifyToken } from "../services/token.service";
import { UserSession } from "../models/UserSession";
import { getOtpTtlSeconds, sendOtpSms } from "../services/sms.service";
import {
  PasswordResetToken,
  type PasswordResetChannel,
} from "../models/PasswordResetToken";
import { sendPasswordResetEmail } from "../services/mail.service";

const registrationLanguages = ["fr-DZ", "ar-DZ", "en"] as const;
const registrationCurrencies = ["DZD", "EUR", "USD"] as const;

type RegistrationLanguage = (typeof registrationLanguages)[number];
type RegistrationCurrency = (typeof registrationCurrencies)[number];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function setAuthCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

async function startAuthenticatedSession(
  req: Request,
  res: Response,
  userId: string
) {
  const sessionId = randomUUID();

  await UserSession.create({
    userId,
    sessionId,
    userAgent: req.get("user-agent") || undefined,
    lastSeenAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  setAuthCookie(res, createToken(userId, sessionId));
}
const PASSWORD_RESET_TTL_SECONDS = 15 * 60;
const PASSWORD_RESET_MAX_SMS_ATTEMPTS = 3;

function isPasswordResetChannel(
  value: unknown
): value is PasswordResetChannel {
  return value === "EMAIL" || value === "SMS";
}

function hashEmailResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isValidPassword(password: string) {
  return password.length >= 8;
}

function isValidPhone(phone: string) {
  return phone.replace(/\D/g, "").length >= 8;
}

export async function register(req: Request, res: Response) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const phone = String(req.body.phone || "").trim();
    const language = String(req.body.language || "");
    const currency = String(req.body.currency || "");
    const newsletterOptIn = req.body.newsletterOptIn;

    if (
      name.length < 2 ||
      name.length > 120 ||
      !isValidEmail(email) ||
      password.length < 8 ||
      !registrationLanguages.includes(language as RegistrationLanguage) ||
      !registrationCurrencies.includes(currency as RegistrationCurrency) ||
      typeof newsletterOptIn !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, valid email, password of at least 8 characters, language, currency and newsletter preference are required",
      });
    }

    if (phone && phone.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Phone number is invalid",
      });
    }

    const existingUser = await User.findOne({ email }).select("_id");

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      phone: phone || undefined,
      passwordHash: await bcrypt.hash(password, 12),
      language: language as RegistrationLanguage,
      currency: currency as RegistrationCurrency,
      newsletterOptIn,
      role: "CLIENT",
    });

    await startAuthenticatedSession(req, res, user._id.toString());

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or phone already exists",
      });
    }

    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.twoFactorEnabled) {
      if (!user.phone) {
        return res.status(400).json({
          success: false,
          message: "Two-factor authentication requires a phone number",
        });
      }

      const activeOtp = await LoginOtp.findOne({
        userId: user._id,
        purpose: "TWO_FACTOR_LOGIN",
        usedAt: { $exists: false },
      }).sort({ createdAt: -1 });

      if (activeOtp && activeOtp.expiresAt.getTime() > Date.now()) {
        return res.status(429).json({
          success: false,
          message: "A security code is already active. Please wait.",
          expiresInSeconds: Math.ceil(
            (activeOtp.expiresAt.getTime() - Date.now()) / 1000
          ),
        });
      }

      await LoginOtp.deleteMany({
        userId: user._id,
        purpose: "TWO_FACTOR_LOGIN",
        usedAt: { $exists: false },
      });

      const code = randomInt(100000, 1000000).toString();
      const expiresInSeconds = await getOtpTtlSeconds();

      const loginOtp = await LoginOtp.create({
        userId: user._id,
        purpose: "TWO_FACTOR_LOGIN",
        codeHash: await bcrypt.hash(code, 12),
        attempts: 0,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      });

      try {
        await sendOtpSms(user.phone, code);
      } catch (error) {
        await LoginOtp.deleteOne({ _id: loginOtp._id });
        throw error;
      }

      return res.json({
        success: true,
        requiresTwoFactor: true,
        message: "OTP sent",
        expiresInSeconds,
        ...(process.env.NODE_ENV !== "production"
          ? { developmentOtp: code }
          : {}),
      });
    }

    await startAuthenticatedSession(req, res, user._id.toString());

    return res.json({
      success: true,
      requiresTwoFactor: false,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
}

export async function verifyTwoFactorLogin(req: Request, res: Response) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const code = String(req.body.code || "").trim();

    if (!email || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "Email and 6-digit OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: "Two-factor authentication is not available",
      });
    }

    const otp = await LoginOtp.findOne({
      userId: user._id,
      purpose: "TWO_FACTOR_LOGIN",
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

    const valid = await bcrypt.compare(code, otp.codeHash);

    if (!valid) {
      otp.attempts += 1;
      await otp.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    otp.usedAt = new Date();
    await otp.save();

    await startAuthenticatedSession(req, res, user._id.toString());

    return res.json({
      success: true,
      message: "Login successful",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to verify two-factor authentication",
    });
  }
}

export async function requestPhoneLoginOtp(
  req: Request,
  res: Response
) {
  try {
    const phone = String(req.body.phone || "").trim();

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone is required",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account exists with this phone number",
      });
    }

    const activeOtp = await LoginOtp.findOne({
      userId: user._id,
      purpose: "PHONE_LOGIN",
      usedAt: { $exists: false },
    }).sort({ createdAt: -1 });

    if (activeOtp && activeOtp.expiresAt.getTime() > Date.now()) {
      return res.status(429).json({
        success: false,
        message: "The current OTP is still valid",
        expiresInSeconds: Math.ceil(
          (activeOtp.expiresAt.getTime() - Date.now()) / 1000
        ),
      });
    }

    await LoginOtp.deleteMany({
      userId: user._id,
      purpose: "PHONE_LOGIN",
      usedAt: { $exists: false },
    });

    const code = randomInt(100000, 1000000).toString();
    const expiresInSeconds = await getOtpTtlSeconds();

    const loginOtp = await LoginOtp.create({
      userId: user._id,
      purpose: "PHONE_LOGIN",
      codeHash: await bcrypt.hash(code, 12),
      attempts: 0,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    });

    try {
      await sendOtpSms(phone, code);
    } catch (error) {
      await LoginOtp.deleteOne({ _id: loginOtp._id });
      throw error;
    }

    return res.json({
      success: true,
      message: "OTP sent",
      expiresInSeconds,
      ...(process.env.NODE_ENV !== "production"
        ? { developmentOtp: code }
        : {}),
    });
  } catch (error) {
    console.error("Phone OTP request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send OTP",
    });
  }
}

export async function verifyPhoneLoginOtp(req: Request, res: Response) {
  try {
    const phone = String(req.body.phone || "").trim();
    const code = String(req.body.code || "").trim();

    if (!phone || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "Phone and 6-digit OTP are required",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = await LoginOtp.findOne({
  userId: user._id,
  purpose: "PHONE_LOGIN",
  usedAt: { $exists: false },
}).sort({ createdAt: -1 });

    if (!otp || otp.expiresAt.getTime() < Date.now()) {
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

    const valid = await bcrypt.compare(code, otp.codeHash);

    if (!valid) {
      otp.attempts += 1;
      await otp.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    otp.usedAt = new Date();
    await otp.save();

    await startAuthenticatedSession(req, res, user._id.toString());

    return res.json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Phone OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP",
    });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const { userId } = verifyToken(token);

    const user = await User.findById(userId).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePhotoUrl: user.profilePhotoUrl,
        language: user.language,
        currency: user.currency,
        newsletterOptIn: user.newsletterOptIn,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
             },
    });
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const token = req.cookies.token;

    if (token) {
      const { userId, sessionId } = verifyToken(token);

      await UserSession.updateOne(
        { userId, sessionId, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } }
      );
    }
  } catch {
    // Always clear the browser cookie, even for an old invalid token.
  }

  res.clearCookie("token");

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
}

export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const channel = req.body.channel;
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();

    if (!isPasswordResetChannel(channel)) {
      return res.status(400).json({
        success: false,
        message: "Choose email or SMS reset.",
      });
    }

    if (channel === "EMAIL" && !email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (channel === "SMS" && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "A valid phone number is required.",
      });
    }

    const user = await User.findOne(
      channel === "EMAIL" ? { email } : { phone }
    );

    const genericResponse = {
      success: true,
      message:
        "If an account exists, reset instructions have been sent.",
    };

    // Do not reveal whether this email or phone exists.
    if (!user) {
      return res.json(genericResponse);
    }

    await PasswordResetToken.deleteMany({
      userId: user._id,
      channel,
      usedAt: { $exists: false },
    });

    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000
    );

    if (channel === "EMAIL") {
      const token = randomBytes(32).toString("hex");

      const resetToken = await PasswordResetToken.create({
        userId: user._id,
        channel,
        tokenHash: hashEmailResetToken(token),
        attempts: 0,
        expiresAt,
      });

      try {
        await sendPasswordResetEmail(user.email, token);
      } catch (error) {
        await PasswordResetToken.deleteOne({ _id: resetToken._id });
        throw error;
      }

      return res.json(genericResponse);
    }

    const code = randomInt(100000, 1000000).toString();

    const resetToken = await PasswordResetToken.create({
      userId: user._id,
      channel,
      tokenHash: await bcrypt.hash(code, 12),
      attempts: 0,
      expiresAt,
    });

    try {
      await sendOtpSms(phone, code);
    } catch (error) {
      await PasswordResetToken.deleteOne({ _id: resetToken._id });
      throw error;
    }

    return res.json({
      ...genericResponse,
      expiresInSeconds: PASSWORD_RESET_TTL_SECONDS,
      ...(process.env.NODE_ENV !== "production"
        ? { developmentCode: code }
        : {}),
    });
  } catch (error) {
    console.error("Password-reset request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send reset instructions.",
    });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const channel = req.body.channel;
    const token = String(req.body.token || "").trim();
    const phone = String(req.body.phone || "").trim();
    const newPassword = String(req.body.newPassword || "");

    if (
      !isPasswordResetChannel(channel) ||
      !token ||
      !isValidPassword(newPassword)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid reset code and a password of at least 8 characters are required.",
      });
    }

    let resetToken:
      | (typeof PasswordResetToken extends never ? never : any)
      | null = null;

    if (channel === "EMAIL") {
      resetToken = await PasswordResetToken.findOne({
        channel: "EMAIL",
        tokenHash: hashEmailResetToken(token),
        usedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      });
    } else {
      if (!isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          message: "A valid phone number is required.",
        });
      }

      const user = await User.findOne({ phone }).select("_id");

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset code.",
        });
      }

      resetToken = await PasswordResetToken.findOne({
        userId: user._id,
        channel: "SMS",
        usedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (
        !resetToken ||
        resetToken.attempts >= PASSWORD_RESET_MAX_SMS_ATTEMPTS
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset code.",
        });
      }

      const validCode = await bcrypt.compare(token, resetToken.tokenHash);

      if (!validCode) {
        resetToken.attempts += 1;
        await resetToken.save();

        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset code.",
        });
      }
    }

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code.",
      });
    }

    const claimedToken = await PasswordResetToken.findOneAndUpdate(
      {
        _id: resetToken._id,
        usedAt: { $exists: false },
      },
      { $set: { usedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!claimedToken) {
      return res.status(400).json({
        success: false,
        message: "This reset code has already been used.",
      });
    }

    const user = await User.findById(claimedToken.userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset request.",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    await Promise.all([
      PasswordResetToken.updateMany(
        {
          userId: user._id,
          usedAt: { $exists: false },
        },
        { $set: { usedAt: new Date() } }
      ),
      UserSession.updateMany(
        {
          userId: user._id,
          revokedAt: { $exists: false },
        },
        { $set: { revokedAt: new Date() } }
      ),
    ]);

    res.clearCookie("token");

    return res.json({
      success: true,
      message: "Password reset successfully. Please sign in.",
    });
  } catch (error) {
   console.error("Password reset error:", error);

if (process.env.NODE_ENV !== "production") {
  return res.status(500).json({
    success: false,
    message:
      error instanceof Error
        ? error.message
        : "Unable to reset the password.",
  });
}
    return res.status(500).json({
      success: false,
      message: "Unable to reset the password.",
    });
  }
}