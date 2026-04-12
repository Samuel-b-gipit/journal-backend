# Journal + Habit Tracker — Backend API

Node.js + Express + TypeScript + PostgreSQL + Prisma

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 4
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT (jsonwebtoken)
- **Password hashing**: bcryptjs
- **Validation**: express-validator

---

## Project Structure

```
journal-backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Demo data seeder
├── routes/                 # Route definitions
│   ├── auth.ts
│   ├── habits.ts
│   ├── entries.ts
│   └── insights.ts
├── controllers/            # Business logic
│   ├── auth.ts
│   ├── habits.ts
│   ├── entries.ts
│   └── insights.ts
├── middleware/
│   ├── auth.ts             # JWT authentication guard
│   └── error.ts            # Global error handler
├── utils/
│   ├── prisma.ts           # Prisma client singleton
│   └── jwt.ts              # Token sign/verify helpers
├── types/
│   └── index.ts            # Shared TypeScript types
├── index.ts                # App entry point
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/journal_db"
JWT_SECRET="your-long-random-secret-here"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

### 3. Create the database

Using psql or any PostgreSQL client:

```sql
CREATE DATABASE journal_db;
```

### 4. Run Prisma migration

```bash
npm run db:migrate
```

This creates all tables based on `prisma/schema.prisma`.

### 5. Generate Prisma client

```bash
npm run db:generate
```

### 6. Seed demo data (optional)

```bash
npm run db:seed
```

This creates:
- **Demo user**: `demo@journal.app` / `password123`
- **5 habits**: Morning Run, Read, Meditation, Water Intake, No Sugar
- **7 journal entries** with habit logs attached

### 7. Start development server

```bash
npm run dev
```

Server will be running at `http://localhost:3000`

---

## API Reference

All protected routes require:
```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user 🔒 |

**Register body:**
```json
{ "email": "user@example.com", "password": "secret123", "name": "Jane" }
```

**Login body:**
```json
{ "email": "user@example.com", "password": "secret123" }
```

---

### Habits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/habits` | List all active habits 🔒 |
| POST | `/api/habits` | Create a habit 🔒 |
| PATCH | `/api/habits/:id` | Update a habit 🔒 |
| DELETE | `/api/habits/:id` | Soft-delete a habit 🔒 |

**Create habit body:**
```json
{
  "name": "Morning Run",
  "type": "DURATION",
  "icon": "directions_run",
  "color": "#E07B54",
  "category": "Fitness"
}
```

Habit types: `BOOLEAN` | `COUNT` | `DURATION`

---

### Journal Entries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/entries` | List entries (optional `?month=1&year=2025`) 🔒 |
| GET | `/api/entries/date/:date` | Get entry by date (`YYYY-MM-DD`) 🔒 |
| PUT | `/api/entries` | Create or update entry for a date 🔒 |
| DELETE | `/api/entries/:id` | Delete entry 🔒 |

**Upsert entry body:**
```json
{
  "date": "2025-01-15",
  "title": "Good day",
  "content": "Today was productive and calm...",
  "mood": 4,
  "habitLogs": [
    { "habitId": "uuid-here", "intValue": 30 },
    { "habitId": "uuid-here", "boolValue": true }
  ]
}
```

Rules enforced:
- One entry per user per date
- Each habit can only appear once per entry
- All habits must belong to the authenticated user

---

### Insights

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights` | Monthly insights (optional `?month=1&year=2025`) 🔒 |

**Response includes:**
- `totalEntries` — entries logged this month
- `journalingRate` — % of days with an entry
- `avgMood` — average mood score (1–5)
- `moodDistribution` — count per mood value
- `currentStreak` — consecutive days with entries up to today
- `habitFrequency` — each habit ranked by log count

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `npm run db:seed` | Run seed file |

---

## Data Model

```
User
 └── Habit[]          (one user → many habits)
 └── JournalEntry[]   (one user → many entries, one per day)
       └── HabitLog[] (each entry → many habit logs, unique per habit)
```

Key constraints:
- `JournalEntry` is unique per `(userId, date)`
- `HabitLog` is unique per `(entryId, habitId)` — enforces one log per habit per day
- Deleting a habit soft-deletes it (`isActive: false`) to preserve historical logs
