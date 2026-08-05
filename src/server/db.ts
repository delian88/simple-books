import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getCookie } from '@tanstack/react-start/server';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export const JWT_SECRET = process.env['JWT_SECRET'] || 'ohi-local-dev-jwt-secret-change-in-production-2025';

export const requireCustomAuth = async () => {
  const token = getCookie('ledgerly_auth');
  if (!token) throw new Error("Unauthorized");

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
    return { userId: payload.userId, role: payload.role };
  } catch (err) {
    throw new Error("Unauthorized");
  }
};
export const requireAdmin = async () => {
  const user = await requireCustomAuth();
  if (user.role !== 'Admin') throw new Error('Unauthorized: Admins only');
  return user;
};
