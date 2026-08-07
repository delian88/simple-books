import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/db";

export const listGateways = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireAdmin();
    return prisma.paymentGateway.findMany({ orderBy: { provider: "asc" } });
  });

export const upsertGateway = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      provider: z.string(),
      publicKey: z.string().optional(),
      secretKey: z.string().optional(),
      isActive: z.boolean(),
      isDefault: z.boolean(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    if (data.isDefault) {
      // Unset any existing default
      await prisma.paymentGateway.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    return prisma.paymentGateway.upsert({
      where: { provider: data.provider },
      update: data,
      create: data
    });
  });
