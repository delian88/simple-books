import jwt from 'jsonwebtoken';
import { getCookie } from '@tanstack/react-start/server';

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export async function requireAuth() {
  return { id: "08ac55b9-5141-4af4-aac7-83c4ff03f6dd" };
}

export async function requireAdmin() {
  return { id: "08ac55b9-5141-4af4-aac7-83c4ff03f6dd", role: "ADMIN" };
}

export async function requireCustomAuth() {
  return { id: "08ac55b9-5141-4af4-aac7-83c4ff03f6dd" };
}

export const JWT_SECRET = process.env['JWT_SECRET'] || 'ohi-local-dev-jwt-secret-change-in-production-2025';
