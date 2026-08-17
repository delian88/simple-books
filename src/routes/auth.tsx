import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { BookOpenText, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { login, signup, getSession } from "@/lib/auth.functions";
import { getPublicSettings } from "@/lib/app.functions";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      mode: (search.mode as "signin" | "signup") || "signin",
    };
  },
  head: () => ({
    meta: [
      { title: "Sign in — Mykobobooks" },
      { name: "description", content: "Sign in to your Mykobobooks books to record inflows, outflows and your balance sheet." },
      { property: "og:title", content: "Sign in — Mykobobooks" },
      { property: "og:description", content: "Sign in to your Mykobobooks books." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode === "signup" ? "signup" : "signin");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (search.mode) {
      setMode(search.mode === "signup" ? "signup" : "signin");
    }
  }, [search.mode]);

  useEffect(() => {
    getSession().then((user) => {
      if (user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const { data: appSettings } = useQuery({
    queryKey: ["app_settings"],
    queryFn: () => getPublicSettings(),
  });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      if (mode === "signup") {
        await signup({ data: { email, password, businessName: businessName.trim() || "My Business" } });
        toast.success("Account created! 14-day free trial started.");
        window.location.href = "/dashboard";
      } else {
        await login({ data: { email, password } });
        toast.success("Welcome back!");
        window.location.href = "/dashboard";
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    toast.error("Google sign-in is not supported on the custom backend.");
  }

  return (
    <div className="ledger-grid flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-display text-2xl">
          {appSettings?.appLogo ? (
            <img src={appSettings.appLogo} alt="App Logo" className="h-8 w-8 object-contain" />
          ) : (
            <BookOpenText className="h-6 w-6 text-accent" />
          )}
          {appSettings?.appName || "Mykobobooks"}
        </Link>
        <Card className="shadow-ledger">
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              {mode === "signin" ? "Welcome back" : "Open your books"}
            </CardTitle>
            <CardDescription>
              {mode === "signin"
                ? "Sign in to keep recording your inflows and outflows."
                : "Create an account — your ledger stays private to you."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">


            <form className="space-y-4" onSubmit={onSubmit}>
              {mode === "signup" ? (
                <div className="grid gap-2">
                  <Label htmlFor="business">Business name</Label>
                  <Input
                    id="business"
                    maxLength={120}
                    placeholder="Adaeze Trading Ltd"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                  />
                </div>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative flex items-center">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-10 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-900 cursor-pointer select-none rounded-md hover:bg-gray-100 transition-colors"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPassword((v) => !v);
                      }}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {notice ? <p className="text-sm text-accent-foreground">{notice}</p> : null}

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  className="inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 cursor-pointer p-2 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMode((v) => (v === "signin" ? "signup" : "signin"));
                  }}
                >
                  {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
                </button>
              </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
