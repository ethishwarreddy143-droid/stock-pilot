import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/crypto";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: "user" | "admin";
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired session token." });
    return;
  }

  req.user = {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role
  };
  
  next();
}

export function adminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  authMiddleware(req, res, () => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      res.status(403).json({ error: "Access denied. Administrator privileges required." });
    }
  });
}
