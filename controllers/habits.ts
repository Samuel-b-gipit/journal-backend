import { Response } from "express";
import { validationResult } from "express-validator";
import { HabitType } from "@prisma/client";
import * as HabitService from "../services/habits";
import { AuthRequest, AppError } from "../types";

export const getHabits = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const habits = await HabitService.getHabits(req.user!.userId);
    res.json({ success: true, data: { habits } });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch habits" });
  }
};

export const createHabit = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res
      .status(400)
      .json({ success: false, errors: errors.array().map((e) => e.msg) });
    return;
  }
  try {
    const habit = await HabitService.createHabit(req.user!.userId, {
      ...req.body,
      type: req.body.type as HabitType,
    });
    res.status(201).json({ success: true, data: { habit } });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to create habit" });
  }
};

export const updateHabit = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res
      .status(400)
      .json({ success: false, errors: errors.array().map((e) => e.msg) });
    return;
  }
  try {
    const habit = await HabitService.updateHabit(
      req.params.id,
      req.user!.userId,
      req.body,
    );
    res.json({ success: true, data: { habit } });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to update habit" });
  }
};

export const deleteHabit = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await HabitService.softDeleteHabit(req.params.id, req.user!.userId);
    res.json({ success: true, message: "Habit deleted" });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to delete habit" });
  }
};
