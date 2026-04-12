import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export type HabitType = 'BOOLEAN' | 'COUNT' | 'DURATION';

export interface HabitLogInput {
  habitId: string;
  boolValue?: boolean;
  intValue?: number;
}
