import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { registerUser, loginUser, getUserById } from "../services/auth";
import { AuthRequest, AppError } from "../types";

export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res
      .status(400)
      .json({ success: false, errors: errors.array().map((e) => e.msg) });
    return;
  }
  try {
    const data = await registerUser(
      req.body.email,
      req.body.password,
      req.body.name,
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res
      .status(400)
      .json({ success: false, errors: errors.array().map((e) => e.msg) });
    return;
  }
  try {
    const data = await loginUser(req.body.email, req.body.password);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await getUserById(req.user!.userId);
    res.json({ success: true, data: { user } });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};
