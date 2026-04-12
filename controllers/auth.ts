import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { AuthRequest } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array().map((e) => e.msg) });
    return;
  }
  const { email, password, name } = req.body;
  try {
    if (await prisma.user.findUnique({ where: { email } })) {
      res.status(409).json({ success: false, message: 'Email already in use' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: { token: signToken({ userId: user.id, email: user.email }), user } });
  } catch {
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array().map((e) => e.msg) });
    return;
  }
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, data: { token: signToken({ userId: user.id, email: user.email }), user: safeUser } });
  } catch {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, data: { user } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};
