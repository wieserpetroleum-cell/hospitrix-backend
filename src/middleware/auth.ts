import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    hospitalId: string;
    role: string;
    name: string;
    email: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, hospitalId: true, role: true, name: true, email: true, isActive: true }
    });

    if (!user || !user.isActive) return res.status(401).json({ error: 'User not found or inactive' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export const checkModule = (module: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const hospital = await prisma.hospital.findUnique({
      where: { id: req.user.hospitalId },
      select: { modules: true }
    });

    const modules = hospital?.modules as Record<string, boolean>;
    if (!modules?.[module]) {
      return res.status(403).json({ error: `Module '${module}' is not enabled for your hospital` });
    }
    next();
  };
};
