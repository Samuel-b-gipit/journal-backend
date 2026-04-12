import { Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest, HabitLogInput } from '../types';

const entrySelect = {
  id: true, date: true, title: true, content: true, mood: true,
  createdAt: true, updatedAt: true,
  habitLogs: {
    include: {
      habit: { select: { id: true, name: true, type: true, icon: true, color: true, category: true } },
    },
  },
};

export const getEntries = async (req: AuthRequest, res: Response): Promise<void> => {
  const { month, year } = req.query;
  try {
    const where: Record<string, unknown> = { userId: req.user!.userId };
    if (month && year) {
      const m = Number(month); const y = Number(year);
      where.date = { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0) };
    }
    const entries = await prisma.journalEntry.findMany({ where, select: entrySelect, orderBy: { date: 'desc' } });
    res.json({ success: true, data: { entries } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch entries' });
  }
};

export const getEntryByDate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { date } = req.params;
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date. Use YYYY-MM-DD' });
      return;
    }
    const entry = await prisma.journalEntry.findUnique({
      where: { userId_date: { userId: req.user!.userId, date: parsed } },
      select: entrySelect,
    });
    if (!entry) { res.status(404).json({ success: false, message: 'No entry for this date' }); return; }
    res.json({ success: true, data: { entry } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch entry' });
  }
};

export const upsertEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array().map((e) => e.msg) });
    return;
  }
  const { date, title, content, mood, habitLogs } = req.body;
  try {
    const parsedDate = new Date(date);

    if (habitLogs?.length > 0) {
      const ids: string[] = habitLogs.map((h: HabitLogInput) => h.habitId);
      if (new Set(ids).size !== ids.length) {
        res.status(400).json({ success: false, message: 'Duplicate habit in entry' });
        return;
      }
      const valid = await prisma.habit.findMany({
        where: { id: { in: ids }, userId: req.user!.userId, isActive: true },
      });
      if (valid.length !== ids.length) {
        res.status(400).json({ success: false, message: 'One or more habits are invalid' });
        return;
      }
    }

    const entry = await prisma.$transaction(async (tx) => {
      const je = await tx.journalEntry.upsert({
        where: { userId_date: { userId: req.user!.userId, date: parsedDate } },
        create: { userId: req.user!.userId, date: parsedDate, title: title ?? null, content, mood: mood ?? null },
        update: { title: title ?? null, content, mood: mood ?? null },
      });
      if (habitLogs !== undefined) {
        await tx.habitLog.deleteMany({ where: { entryId: je.id } });
        if (habitLogs.length > 0) {
          await tx.habitLog.createMany({
            data: habitLogs.map((l: HabitLogInput) => ({
              entryId: je.id, habitId: l.habitId,
              boolValue: l.boolValue ?? null, intValue: l.intValue ?? null,
            })),
          });
        }
      }
      return tx.journalEntry.findUnique({ where: { id: je.id }, select: entrySelect });
    });

    res.json({ success: true, data: { entry } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to save entry' });
  }
};

export const deleteEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const existing = await prisma.journalEntry.findFirst({ where: { id, userId: req.user!.userId } });
    if (!existing) { res.status(404).json({ success: false, message: 'Entry not found' }); return; }
    await prisma.journalEntry.delete({ where: { id } });
    res.json({ success: true, message: 'Entry deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete entry' });
  }
};
