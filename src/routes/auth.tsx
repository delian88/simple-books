import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenText, Eye, EyeOff, ArrowLeft } from "lucide-react";
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
      { title: "Sign in — My KoboBooks" },
      { name: "description", content: "Sign in to your My KoboBooks books to record inflows, outflows and your balance sheet." },
      { property: "og:title", content: "Sign in — My KoboBooks" },
      { property: "og:description", content: "Sign in to your My KoboBooks books." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
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
      if (user) window.location.href = "/dashboard";
    });
  }, []);

  const { data: appSettings } = useQuery({
    queryKey: ["app_settings"],
    queryFn: () => getPublicSettings(),
  });

  async function handleLogin() {
    console.log("🔵 handleLogin fired, mode:", mode, "email:", email);
    setBusy(true);
    setNotice("");
    try {
      if (mode === "signup") {
        await signup({ data: { email, password, businessName: businessName.trim() || "My Business" } });
        toast.success("Account created! 14-day free trial started.");
        window.location.replace("/dashboard");
      } else {
        console.log("🔵 Calling login API...");
        const res = await login({ data: { email, password } });
        console.log("🔵 Login API response:", res);
        if (!res || !res.token) throw new Error("No token returned from server");
        console.log("✅ Login success, redirecting to dashboard...");
        toast.success("Welcome back!");
        window.location.replace("/dashboard");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      const msg = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(msg);
      setNotice(msg);
      setBusy(false);
    }
  }

  return (
    <div className="ledger-grid flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-display text-2xl">
          {appSettings?.appLogo ? (
            <img src={appSettings.appLogo} alt="App Logo" className="h-8 w-8 object-contain" />
          ) : (
            <BookOpenText className="h-6 w-6 text-accent" />
          )}
          {appSettings?.appName || "My KoboBooks"}
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


            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pr-10"
                    required
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-900 cursor-pointer select-none rounded-md hover:bg-gray-100 transition-colors z-20"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword(!showPassword);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword(!showPassword);
                    }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </div>
                </div>
              </div>

                {notice ? <p className="text-sm text-accent-foreground">{notice}</p> : null}

                <Button type="button" className="w-full" disabled={busy} onClick={handleLogin}>
                  {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <div className="pt-2 text-center">
                {mode === "signin" ? (
                  <Link
                    to="/auth"
                    search={{ mode: "signup" }}
                    className="inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 cursor-pointer p-2 transition-colors"
                  >
                    New here? Create an account
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    search={{ mode: "signin" }}
                    className="inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 cursor-pointer p-2 transition-colors"
                  >
                    Already have an account? Sign in
                  </Link>
                )}
              </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
