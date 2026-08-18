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
      { name: "description", content: "Sign in to your My KoboBooks account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">(
    search.mode === "signup" ? "signup" : "signin"
  );
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // First effect: mark as mounted so we know React is running
  useEffect(() => {
    setMounted(true);
    console.log("✅ AuthPage mounted — React is running!");
  }, []);

  useEffect(() => {
    setMode(search.mode === "signup" ? "signup" : "signin");
    // Reset loading whenever mode changes (guard against stuck state)
    setLoading(false);
  }, [search.mode]);

  // Redirect if already logged in
  useEffect(() => {
    getSession().then((user) => {
      if (user) {
        window.location.replace("/dashboard");
      }
    });
  }, []);

  const { data: appSettings } = useQuery({
    queryKey: ["app_settings"],
    queryFn: () => getPublicSettings(),
  });

  async function handleSignIn() {
    console.log("🔵 handleSignIn called", { email, password: password ? "***" : "(empty)" });
    if (!email || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      console.log("🔵 Calling login API...");
      const res = await login({ data: { email, password } });
      console.log("🔵 Login API response:", res);
      if (!res?.token) throw new Error("No token returned from server.");
      console.log("✅ Login success! Redirecting...");
      toast.success("Welcome back!");
      window.location.replace("/dashboard");
    } catch (err) {
      console.error("❌ Login failed:", err);
      const msg = err instanceof Error ? err.message : "Sign in failed. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  async function handleSignUp() {
    if (!email || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      await signup({ data: { email, password, businessName: businessName.trim() || "My Business" } });
      toast.success("Account created! Welcome to My KoboBooks.");
      window.location.replace("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign up failed. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  const handleSubmit = mode === "signin" ? handleSignIn : handleSignUp;

  return (
    <div className="ledger-grid flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Back to Home */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        {/* React hydration status indicator */}
        <div style={{
          padding: '8px 12px',
          borderRadius: '6px',
          marginBottom: '12px',
          fontSize: '13px',
          fontWeight: 'bold',
          backgroundColor: mounted ? '#d4edda' : '#f8d7da',
          color: mounted ? '#155724' : '#721c24',
          border: `1px solid ${mounted ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {mounted ? '✅ React is running — button should work' : '❌ React NOT hydrated — button will not work'}
        </div>

        {/* App Logo */}
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
            {/* Business name (signup only) */}
            {mode === "signup" && (
              <div className="grid gap-2">
                <Label htmlFor="business">Business name</Label>
                <Input
                  id="business"
                  maxLength={120}
                  placeholder="Adaeze Trading Ltd"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
            )}

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-900 cursor-pointer rounded-md hover:bg-gray-100 transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {errorMsg && (
              <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
            )}

            {/* Submit button */}
            <Button
              type="button"
              className="w-full"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>

            {/* Mode switch */}
            <div className="pt-2 text-center">
              {mode === "signin" ? (
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 transition-colors"
                >
                  New here? Create an account
                </Link>
              ) : (
                <Link
                  to="/auth"
                  search={{ mode: "signin" }}
                  className="inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 transition-colors"
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
