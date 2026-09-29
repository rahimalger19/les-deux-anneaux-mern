import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User";
import { UserSession } from "../models/UserSession";
import { verifyToken } from "../services/token.service";

type UserRole =
  | "CLIENT"
  | "RECEPTION"
  | "MANAGER"
  | "COMPTA"
  | "READONLY"
  | "SUPER_ADMIN";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        sessionId: string;
      };
    }
  }
}

async function getAuthenticatedUser(token: string) {
  const { userId, sessionId } = verifyToken(token);

  const [user, session] = await Promise.all([
    User.findById(userId).select("_id role"),
    UserSession.findOne({
      userId,
      sessionId,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }),
  ]);

  if (!user || !session) {
    return null;
  }

  await UserSession.updateOne(
    { _id: session._id },
    { $set: { lastSeenAt: new Date() } }
  );

  return {
    id: user._id.toString(),
    role: user.role as UserRole,
    sessionId,
  };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await getAuthenticatedUser(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Session is no longer valid",
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission for this action",
      });
    }

    next();
  };
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token = req.cookies.token;

  if (!token) {
    return next();
  }

  try {
    const user = await getAuthenticatedUser(token);

    if (user) {
      req.user = user;
    }
  } catch {
    // An invalid optional session must not block guest checkout.
  }

  next();
}