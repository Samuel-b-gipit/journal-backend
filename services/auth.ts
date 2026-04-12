import bcrypt from "bcryptjs";
import prisma from "../utils/prisma";
import { signToken } from "../utils/jwt";
import { AppError } from "../types";

export const registerUser = async (
  email: string,
  password: string,
  name: string,
) => {
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new AppError("Email already in use", 409);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  return { token: signToken({ userId: user.id, email: user.email }), user };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Invalid credentials", 401);
  }
  const { passwordHash: _, ...safeUser } = user;
  return {
    token: signToken({ userId: user.id, email: user.email }),
    user: safeUser,
  };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
};
