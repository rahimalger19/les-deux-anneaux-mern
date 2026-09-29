import type { Request, Response } from "express";
import { User } from "../models/User";

export async function getMyProfile(req: Request, res: Response) {
  const user = await User.findById(req.user?.id).select(
    "name email phone country profilePhotoUrl language currency"
  );

  if (!user) {
    return res.status(404).json({
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
      country: user.country,
      profilePhotoUrl: user.profilePhotoUrl,
      language: user.language,
      currency: user.currency,
    },
  });
}

export async function updateMyProfile(req: Request, res: Response) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const country = String(req.body.country || "").trim();

    if (!name || !email || !country) {
      return res.status(400).json({
        success: false,
        message: "Name, email and country are required",
      });
    }

    const duplicateUser = await User.findOne({
      email,
      _id: { $ne: req.user?.id },
    });

    if (duplicateUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const user = await User.findById(req.user?.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.name = name;
    user.email = email;
    user.phone = phone || undefined;
    user.country = country;

    if (req.file) {
      user.profilePhotoUrl = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        profilePhotoUrl: user.profilePhotoUrl,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update profile",
    });
  }
}