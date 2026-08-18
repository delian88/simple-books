import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth.functions";
import { NotificationProvider } from "@/contexts/NotificationContext";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getSession();
    if (!user || user.role !== "Admin") {
      throw redirect({ to: "/dashboard" });
    }
    return { user };
  },
  component: () => (
    <NotificationProvider>
      <Outlet />
    </NotificationProvider>
  ),
});
