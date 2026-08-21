'use client';

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpenText, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { login, signup, getSession } from "@/lib/auth.functions";
import { getPublicSettings } from "@/lib/app.functions";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function AuthContent() {
  const searchParams = useSearchParams();
  const searchMode = searchParams.get("mode");
  const mode = searchMode === "signup" ? "signup" : "signin";
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { data: appSettings } = useQuery({
    queryKey: ["app_settings"],
    queryFn: () => getPublicSettings(),
    staleTime: 5 * 60 * 1000,
    retry: false,
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
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("❌ Login failed:", err);
      const msg = err instanceof Error ? err.message : "Sign in failed. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
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
      toast.success("Account created! Welcome to KoboBooks.");
      window.location.href = "/dashboard";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign up failed. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
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
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        {/* App Logo */}
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-display text-2xl">
          {appSettings?.appLogo ? (
            <img src={appSettings.appLogo} alt="App Logo" className="h-8 w-8 object-contain" />
          ) : (
            <BookOpenText className="h-6 w-6 text-accent" />
          )}
          {appSettings?.appName || "KoboBooks"}
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
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
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
              className="w-full cursor-pointer"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>

            {/* Mode switch */}
            <div className="pt-2 text-center">
              {mode === "signin" ? (
                <Link
                  href="/auth?mode=signup"
                  className="inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 transition-colors"
                >
                  New here? Create an account
                </Link>
              ) : (
                <Link
                  href="/auth?mode=signin"
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

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}
