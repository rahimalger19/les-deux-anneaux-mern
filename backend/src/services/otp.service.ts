import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { Otp } from "../models/Otp";
import { getOtpTtlSeconds } from "./sms.service";

export type IssuedBookingOtp = {
  code: string;
  expiresInSeconds: number;
};

export type ResentBookingOtp =
  | {
      sent: true;
      code: string;
      expiresInSeconds: number;
    }
  | {
      sent: false;
      retryAt: Date;
    };

export async function createOtpForBooking(
  bookingId: string
): Promise<IssuedBookingOtp> {
  const code = randomInt(100000, 1000000).toString();
  const expiresInSeconds = await getOtpTtlSeconds();

  await Otp.deleteMany({
    bookingId,
    usedAt: { $exists: false },
  });

  await Otp.create({
    bookingId,
    codeHash: await bcrypt.hash(code, 12),
    attempts: 0,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
  });

  return { code, expiresInSeconds };
}

export async function discardUnusedOtpForBooking(bookingId: string) {
  await Otp.deleteMany({
    bookingId,
    usedAt: { $exists: false },
  });
}

export async function verifyOtpForBooking(
  bookingId: string,
  code: string
): Promise<{ valid: boolean; message: string }> {
  const otp = await Otp.findOne({
    bookingId,
    usedAt: { $exists: false },
  }).sort({ createdAt: -1 });

  if (!otp) {
    return { valid: false, message: "OTP not found or already used" };
  }

  if (otp.expiresAt.getTime() <= Date.now()) {
    return { valid: false, message: "OTP expired" };
  }

  if (otp.attempts >= 3) {
    return { valid: false, message: "Too many incorrect attempts" };
  }

  const valid = await bcrypt.compare(code, otp.codeHash);

  if (!valid) {
    otp.attempts += 1;
    await otp.save();

    return { valid: false, message: "Invalid OTP" };
  }

  otp.usedAt = new Date();
  await otp.save();

  return { valid: true, message: "OTP verified" };
}

export async function resendOtpForBooking(
  bookingId: string
): Promise<ResentBookingOtp> {
  const activeOtp = await Otp.findOne({
    bookingId,
    usedAt: { $exists: false },
  }).sort({ createdAt: -1 });

  if (activeOtp && activeOtp.expiresAt.getTime() > Date.now()) {
    return {
      sent: false,
      retryAt: activeOtp.expiresAt,
    };
  }

  const issuedOtp = await createOtpForBooking(bookingId);

  return {
    sent: true,
    ...issuedOtp,
  };
}