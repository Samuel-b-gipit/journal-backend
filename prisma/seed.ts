import { PrismaClient, HabitType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@journal.app' },
    update: {},
    create: {
      email: 'demo@journal.app',
      passwordHash,
      name: 'Demo User',
    },
  });

  const habits = await Promise.all([
    prisma.habit.upsert({
      where: { userId_name: { userId: user.id, name: 'Morning Run' } },
      update: {},
      create: { userId: user.id, name: 'Morning Run', type: HabitType.DURATION, icon: 'directions_run', color: '#E07B54', category: 'Fitness' },
    }),
    prisma.habit.upsert({
      where: { userId_name: { userId: user.id, name: 'Read' } },
      update: {},
      create: { userId: user.id, name: 'Read', type: HabitType.DURATION, icon: 'menu_book', color: '#6B8F71', category: 'Learning' },
    }),
    prisma.habit.upsert({
      where: { userId_name: { userId: user.id, name: 'Meditation' } },
      update: {},
      create: { userId: user.id, name: 'Meditation', type: HabitType.DURATION, icon: 'self_improvement', color: '#A0846C', category: 'Wellness' },
    }),
    prisma.habit.upsert({
      where: { userId_name: { userId: user.id, name: 'Water Intake' } },
      update: {},
      create: { userId: user.id, name: 'Water Intake', type: HabitType.COUNT, icon: 'water_drop', color: '#7EB8C9', category: 'Health' },
    }),
    prisma.habit.upsert({
      where: { userId_name: { userId: user.id, name: 'No Sugar' } },
      update: {},
      create: { userId: user.id, name: 'No Sugar', type: HabitType.BOOLEAN, icon: 'no_food', color: '#C9956B', category: 'Health' },
    }),
  ]);

  // Seed 7 days of journal entries
  const today = new Date();
  const entries = [
    { daysAgo: 0, title: 'A fresh start', content: 'Woke up early today and felt genuinely excited. The morning light was golden and I had time to just sit with my coffee before the day started. Grateful for small moments like this.', mood: 4 },
    { daysAgo: 1, title: 'Long day', content: 'Back-to-back meetings drained me more than I expected. Managed to squeeze in a run before sunset which helped reset my head. Need to protect my mornings better.', mood: 3 },
    { daysAgo: 2, title: null, content: 'Quiet Sunday. Finished the book I started last month. It left me with a lot to think about — especially the part about how we spend our attention.', mood: 5 },
    { daysAgo: 3, title: 'Finding rhythm', content: 'Three days in a row of meditation. I can feel the difference in how I respond to things instead of reacting. Small wins.', mood: 4 },
    { daysAgo: 4, title: null, content: 'Skipped the run today. Felt tired and gave myself permission to rest. Tomorrow is another day.', mood: 2 },
    { daysAgo: 5, title: 'Productive flow', content: 'One of those rare days where everything clicked. Finished work early, cooked a proper meal, and had a long call with an old friend.', mood: 5 },
    { daysAgo: 6, title: null, content: 'Average day. Nothing remarkable, nothing bad. Just steady.', mood: 3 },
  ];

  for (const e of entries) {
    const date = new Date(today);
    date.setDate(date.getDate() - e.daysAgo);
    date.setHours(0, 0, 0, 0);

    const entry = await prisma.journalEntry.upsert({
      where: { userId_date: { userId: user.id, date } },
      update: {},
      create: { userId: user.id, date, title: e.title, content: e.content, mood: e.mood },
    });

    // Attach some habits to each entry
    const logsToCreate = [];
    if (e.daysAgo % 2 === 0) logsToCreate.push({ entryId: entry.id, habitId: habits[0].id, intValue: 30 }); // 30min run
    if (e.daysAgo < 5) logsToCreate.push({ entryId: entry.id, habitId: habits[1].id, intValue: 45 }); // 45min reading
    if (e.daysAgo % 3 !== 0) logsToCreate.push({ entryId: entry.id, habitId: habits[2].id, intValue: 10 }); // meditation
    logsToCreate.push({ entryId: entry.id, habitId: habits[3].id, intValue: 8 }); // 8 glasses water
    if (e.mood >= 4) logsToCreate.push({ entryId: entry.id, habitId: habits[4].id, boolValue: true }); // no sugar

    for (const log of logsToCreate) {
      await prisma.habitLog.upsert({
        where: { entryId_habitId: { entryId: log.entryId, habitId: log.habitId } },
        update: {},
        create: log,
      });
    }
  }

  console.log(`✅ Seeded user: demo@journal.app / password123`);
  console.log(`✅ Seeded ${habits.length} habits`);
  console.log(`✅ Seeded ${entries.length} journal entries`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
