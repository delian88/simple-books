import { requireCustomAuth } from "@/server/db";
import { createMiddleware } from "@tanstack/react-start";

export const requireSupabaseAuth = createMiddleware().server(async ({ next }) => {
  try {
    const payload = await requireCustomAuth();
    return next({ context: { userId: payload.userId, role: payload.role } });
  } catch {
    throw new Error("Unauthorized");
  }
});
