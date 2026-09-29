import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { User } from "../models/User";

const STAFF_ROLES = [
  "RECEPTION",
  "MANAGER",
  "COMPTA",
  "READONLY",
] as const;

type StaffRole = (typeof STAFF_ROLES)[number];

function isStaffRole(value: string): value is StaffRole {
  return STAFF_ROLES.includes(value as StaffRole);
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getSuperTeam(_req: Request, res: Response) {
  try {
    const users = await User.find({
      role: { $in: STAFF_ROLES },
    })
      .select("name email phone role createdAt")
      .sort({ role: 1, name: 1 })
      .lean();

    return res.json({
      success: true,
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load team",
    });
  }
}

export async function createSuperTeamUser(
  req: Request,
  res: Response
) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "");

    if (!name || !email || password.length < 8 || !isStaffRole(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password of at least 8 characters and a valid staff role are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email },
        ...(phone ? [{ phone }] : []),
      ],
    }).select("_id");

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email or phone is already used",
      });
    }

    const user = await User.create({
      name,
      email,
      phone: phone || undefined,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      language: "fr-DZ",
      currency: "DZD",
      newsletterOptIn: false,
      twoFactorEnabled: false,
    });

    await AuditLog.create({
      actorId: req.user?.id,
      action: "SUPER_TEAM_USER_CREATED",
      entityType: "User",
      entityId: user._id.toString(),
      metadata: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Staff account created",
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or phone is already used",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create staff account",
    });
  }
}

export async function updateSuperTeamUser(
  req: Request,
  res: Response
) {
  try {
    const userId = getParam(req.params.userId);
    const role = String(req.body.role || "");

    if (!userId || !isStaffRole(role)) {
      return res.status(400).json({
        success: false,
        message: "Staff user ID and valid role are required",
      });
    }

    const user = await User.findOne({
      _id: userId,
      role: { $in: STAFF_ROLES },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Staff account not found",
      });
    }

    const previousRole = user.role;

    user.role = role;
    await user.save();

    await AuditLog.create({
      actorId: req.user?.id,
      action: "SUPER_TEAM_USER_ROLE_UPDATED",
      entityType: "User",
      entityId: user._id.toString(),
      metadata: {
        previousRole,
        nextRole: role,
      },
    });

    return res.json({
      success: true,
      message: "Staff role updated",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update staff role",
    });
  }
}