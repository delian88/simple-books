import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { prisma, JWT_SECRET, requireCustomAuth } from '@/server/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { setCookie, deleteCookie } from '@tanstack/react-start/server';

export const login = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ email: z.string().email(), password: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new Error('Invalid email or password');
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new Error('Invalid email or password');

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        description: "User logged in to the platform."
      }
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    setCookie('ledgerly_auth', token, { maxAge: 86400, path: '/' });
    return { ok: true };
  });

export const signup = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ email: z.string().email(), password: z.string(), businessName: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new Error('Email already in use');
    const pass = await bcrypt.hash(data.password, 10);
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 14);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: pass,
        role: 'Company',
        subscriptionStatus: 'TRIAL',
        trialEndsAt: trialEnds,
        profile: {
          create: { businessName: data.businessName || 'My Business' }
        },
        activityLogs: {
          create: {
            action: "SIGNUP",
            description: "User registered a new company account."
          }
        }
      }
    });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    setCookie('ledgerly_auth', token, { maxAge: 86400, path: '/' });
    return { ok: true };
  });

export const logout = createServerFn({ method: 'POST' })
  .handler(async () => {
    deleteCookie('ledgerly_auth', { path: '/' });
    return { ok: true };
  });

export const getSession = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const payload = await requireCustomAuth();
      const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true, role: true } });
      if (!user) return null;
      return user;
    } catch {
      return null;
    }
  });


