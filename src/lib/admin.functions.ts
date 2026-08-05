import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma, requireAdmin } from "@/server/db";

export const getSystemSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireAdmin();
    const settings = await prisma.systemSettings.findMany();
    const result: Record<string, string> = {};
    settings.forEach(s => result[s.key] = s.value);
    return result;
  });

export const updateSystemSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.record(z.string(), z.string()).parse(input))
  .handler(async ({ data }) => {
    await requireAdmin();
    const ops = Object.entries(data).map(([key, value]) =>
      prisma.systemSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    );
    await prisma.$transaction(ops);
    return { ok: true };
  });
