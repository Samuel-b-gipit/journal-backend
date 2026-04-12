import { HabitType } from "@prisma/client";
import prisma from "../utils/prisma";
import { AppError } from "../types";

export const getHabits = async (userId: string) => {
  return prisma.habit.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });
};

export const createHabit = async (
  userId: string,
  data: {
    name: string;
    type: HabitType;
    icon?: string;
    color?: string;
    category?: string;
  },
) => {
  try {
    return await prisma.habit.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        icon: data.icon ?? null,
        color: data.color ?? null,
        category: data.category ?? null,
      },
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError("A habit with this name already exists", 409);
    }
    throw err;
  }
};

export const updateHabit = async (
  id: string,
  userId: string,
  data: { name?: string; icon?: string; color?: string; category?: string },
) => {
  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Habit not found", 404);
  return prisma.habit.update({ where: { id }, data });
};

export const softDeleteHabit = async (id: string, userId: string) => {
  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Habit not found", 404);
  await prisma.habit.update({ where: { id }, data: { isActive: false } });
};
