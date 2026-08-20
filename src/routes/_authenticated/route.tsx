import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { getSession } from "@/lib/auth.functions";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { NotificationProvider } from "@/contexts/NotificationContext";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthGuard,
});

function AuthGuard() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    staleTime: 30_000,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !user && typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
      navigate({ to: "/auth", replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <NotificationProvider>
      <Outlet />
    </NotificationProvider>
  );
}
