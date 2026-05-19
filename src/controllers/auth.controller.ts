import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, hospitalCode } = req.body;

    if (!email || !password || !hospitalCode) {
      return res.status(400).json({ error: 'Email, password and hospital code are required' });
    }

    // Find hospital
    const hospital = await prisma.hospital.findUnique({
      where: { code: hospitalCode },
      select: { id: true, name: true, isActive: true, modules: true, subscriptionExpires: true }
    });

    if (!hospital || !hospital.isActive) {
      return res.status(401).json({ error: 'Hospital not found or inactive' });
    }

    // Check subscription
    if (hospital.subscriptionExpires && new Date() > hospital.subscriptionExpires) {
      return res.status(403).json({ error: 'Hospital subscription has expired' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { hospitalId_email: { hospitalId: hospital.id, email } },
      select: { id: true, name: true, email: true, role: true, passwordHash: true, isActive: true, hospitalId: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, hospitalId: user.hospitalId, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as any
    );

    // Log audit
    await prisma.auditLog.create({
      data: {
        hospitalId: hospital.id,
        userId: user.id,
        action: 'login',
        module: 'auth',
        details: { email, ip: req.ip }
      }
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalName: hospital.name,
        modules: hospital.modules,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, role: true, department: true,
        hospital: {
          select: { id: true, name: true, code: true, modules: true, logoUrl: true }
        }
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  await prisma.auditLog.create({
    data: {
      hospitalId: req.user!.hospitalId,
      userId: req.user!.id,
      action: 'logout',
      module: 'auth',
    }
  });
  res.json({ message: 'Logged out successfully' });
};
