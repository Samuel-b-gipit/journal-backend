import prisma from "../utils/prisma";
import { AppError, HabitLogInput } from "../types";

const entrySelect = {
  id: true,
  date: true,
  title: true,
  content: true,
  mood: true,
  createdAt: true,
  updatedAt: true,
  habitLogs: {
    include: {
      habit: {
        select: {
          id: true,
          name: true,
          type: true,
          icon: true,
          color: true,
          category: true,
        },
      },
    },
  },
};

export const getEntries = async (
  userId: string,
  month?: number,
  year?: number,
) => {
  const where: Record<string, unknown> = { userId };
  if (month && year) {
    where.date = {
      gte: new Date(year, month - 1, 1),
      lte: new Date(year, month, 0),
    };
  }
  return prisma.journalEntry.findMany({
    where,
    select: entrySelect,
    orderBy: { date: "desc" },
  });
};

export const getEntryByDate = async (userId: string, dateStr: string) => {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime()))
    throw new AppError("Invalid date. Use YYYY-MM-DD", 400);
  const entry = await prisma.journalEntry.findUnique({
    where: { userId_date: { userId, date: parsed } },
    select: entrySelect,
  });
  if (!entry) throw new AppError("No entry for this date", 404);
  return entry;
};

export const upsertEntry = async (
  userId: string,
  data: {
    date: string;
    title?: string;
    content: string;
    mood?: number;
    habitLogs?: HabitLogInput[];
  },
) => {
  const parsedDate = new Date(data.date);

  if (data.habitLogs && data.habitLogs.length > 0) {
    const ids = data.habitLogs.map((h) => h.habitId);
    if (new Set(ids).size !== ids.length) {
      throw new AppError("Duplicate habit in entry", 400);
    }
    const valid = await prisma.habit.findMany({
      where: { id: { in: ids }, userId, isActive: true },
    });
    if (valid.length !== ids.length) {
      throw new AppError("One or more habits are invalid", 400);
    }
  }

  return prisma.$transaction(async (tx) => {
    const je = await tx.journalEntry.upsert({
      where: { userId_date: { userId, date: parsedDate } },
      create: {
        userId,
        date: parsedDate,
        title: data.title ?? null,
        content: data.content,
        mood: data.mood ?? null,
      },
      update: {
        title: data.title ?? null,
        content: data.content,
        mood: data.mood ?? null,
      },
    });
    if (data.habitLogs !== undefined) {
      await tx.habitLog.deleteMany({ where: { entryId: je.id } });
      if (data.habitLogs.length > 0) {
        await tx.habitLog.createMany({
          data: data.habitLogs.map((l) => ({
            entryId: je.id,
            habitId: l.habitId,
            boolValue: l.boolValue ?? null,
            intValue: l.intValue ?? null,
          })),
        });
      }
    }
    return tx.journalEntry.findUnique({
      where: { id: je.id },
      select: entrySelect,
    });
  });
};

export const deleteEntry = async (id: string, userId: string) => {
  const existing = await prisma.journalEntry.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new AppError("Entry not found", 404);
  await prisma.journalEntry.delete({ where: { id } });
};
