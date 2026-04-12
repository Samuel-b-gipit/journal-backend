import { Response } from "express";
import * as InsightService from "../services/insights";
import { AuthRequest } from "../types";

export const getInsights = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { month, year } = req.query;
    const data = await InsightService.getInsights(
      req.user!.userId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
    res.json({ success: true, data });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to generate insights" });
  }
};
