import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/db";

export const listPages = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireAdmin();
    return prisma.page.findMany({ orderBy: { createdAt: "desc" } });
  });

export const getPageBySlug = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    // Public accessible (not restricted to admin) for rendering
    return prisma.page.findUnique({ where: { slug: data.slug } });
  });

export const upsertPage = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      id: z.string().optional(),
      slug: z.string().min(1),
      title: z.string().min(1),
      content: z.string(),
      published: z.boolean()
    }).parse(input)
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { id, ...pageData } = data;
    if (id) {
      return prisma.page.update({ where: { id }, data: pageData });
    }
    return prisma.page.create({ data: pageData });
  });

export const deletePage = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    await requireAdmin();
    await prisma.page.delete({ where: { id: data.id } });
    return { ok: true };
  });
