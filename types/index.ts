import { Request } from "express";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export type HabitType = "BOOLEAN" | "COUNT" | "DURATION";

export interface HabitLogInput {
  habitId: string;
  boolValue?: boolean;
  intValue?: number;
}
