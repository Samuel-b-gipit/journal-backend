import { Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';

export const getHabits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.user!.userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: { habits } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch habits' });
  }
};

export const createHabit = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array().map((e) => e.msg) });
    return;
  }
  const { name, type, icon, color, category } = req.body;
  try {
    const habit = await prisma.habit.create({
      data: { userId: req.user!.userId, name, type, icon: icon ?? null, color: color ?? null, category: category ?? null },
    });
    res.status(201).json({ success: true, data: { habit } });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      res.status(409).json({ success: false, message: 'A habit with this name already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create habit' });
  }
};

export const updateHabit = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array().map((e) => e.msg) });
    return;
  }
  const { id } = req.params;
  const { name, icon, color, category } = req.body;
  try {
    const existing = await prisma.habit.findFirst({ where: { id, userId: req.user!.userId } });
    if (!existing) { res.status(404).json({ success: false, message: 'Habit not found' }); return; }
    const habit = await prisma.habit.update({ where: { id }, data: { name, icon, color, category } });
    res.json({ success: true, data: { habit } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update habit' });
  }
};

export const deleteHabit = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const existing = await prisma.habit.findFirst({ where: { id, userId: req.user!.userId } });
    if (!existing) { res.status(404).json({ success: false, message: 'Habit not found' }); return; }
    // Soft delete to preserve historical logs
    await prisma.habit.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Habit deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete habit' });
  }
};
