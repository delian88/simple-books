import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/db";

export const listUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireAdmin();
    return prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: "desc" }
    });
  });

export const listActivities = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ userId: z.string().optional() }).optional().parse(input))
  .handler(async ({ data }) => {
    await requireAdmin();
    return prisma.activityLog.findMany({
      where: data?.userId ? { userId: data.userId } : undefined,
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: "desc" }
    });
  });
