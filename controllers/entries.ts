import { Response } from "express";
import { validationResult } from "express-validator";
import * as EntryService from "../services/entries";
import { AuthRequest, AppError } from "../types";

export const getEntries = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { month, year } = req.query;
    const entries = await EntryService.getEntries(
      req.user!.userId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
    res.json({ success: true, data: { entries } });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch entries" });
  }
};

export const getEntryByDate = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const entry = await EntryService.getEntryByDate(
      req.user!.userId,
      req.params.date,
    );
    res.json({ success: true, data: { entry } });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to fetch entry" });
  }
};

export const upsertEntry = async (
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
    const entry = await EntryService.upsertEntry(req.user!.userId, req.body);
    res.json({ success: true, data: { entry } });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to save entry" });
  }
};

export const deleteEntry = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await EntryService.deleteEntry(req.params.id, req.user!.userId);
    res.json({ success: true, message: "Entry deleted" });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to delete entry" });
  }
};
