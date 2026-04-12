import prisma from "../utils/prisma";

export const getInsights = async (
  userId: string,
  month?: number,
  year?: number,
) => {
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  const daysInMonth = end.getDate();

  const entries = await prisma.journalEntry.findMany({
    where: { userId, date: { gte: start, lte: end } },
    include: {
      habitLogs: {
        include: {
          habit: { select: { id: true, name: true, type: true, color: true } },
        },
      },
    },
  });

  const moodEntries = entries.filter((e) => e.mood !== null);
  const avgMood = moodEntries.length
    ? Math.round(
        (moodEntries.reduce((s, e) => s + (e.mood ?? 0), 0) /
          moodEntries.length) *
          10,
      ) / 10
    : null;

  const habitMap: Record<
    string,
    { name: string; color: string | null; count: number; totalValue: number }
  > = {};
  for (const entry of entries) {
    for (const log of entry.habitLogs) {
      if (!habitMap[log.habit.id]) {
        habitMap[log.habit.id] = {
          name: log.habit.name,
          color: log.habit.color,
          count: 0,
          totalValue: 0,
        };
      }
      habitMap[log.habit.id].count++;
      habitMap[log.habit.id].totalValue += log.intValue ?? 0;
    }
  }

  const all = await prisma.journalEntry.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: "desc" },
  });
  const dateSet = new Set(
    all.map((e) => new Date(e.date).toISOString().split("T")[0]),
  );
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (dateSet.has(cursor.toISOString().split("T")[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const moodDist = [1, 2, 3, 4, 5].map((v) => ({
    mood: v,
    count: entries.filter((e) => e.mood === v).length,
  }));

  return {
    period: { month: m, year: y },
    totalEntries: entries.length,
    journalingRate: Math.round((entries.length / daysInMonth) * 100),
    avgMood,
    moodDistribution: moodDist,
    currentStreak: streak,
    habitFrequency: Object.entries(habitMap)
      .map(([id, v]) => ({ habitId: id, ...v }))
      .sort((a, b) => b.count - a.count),
  };
};
