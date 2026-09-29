import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing in backend/.env");
  }

  return secret;
}

export function createToken(userId: string, sessionId: string) {
  return jwt.sign({ userId, sessionId }, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as {
    userId: string;
    sessionId: string;
  };
}