"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { SignInWithGoogle } from "./loginWithGoogle";
import { routes } from "@/lib/routes";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false); // NEW: toggle state
  const router = useRouter();
  const supabase = createClient();

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password: string) => password.length >= 8;

  useEffect(() => {
    // Centralized post-login routing based on Supabase session + profile.
    // This handles both email/password and OAuth (Google) sign-ins.
    // @ts-ignore - Supabase typing for onAuthStateChange is more specific
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (event === "SIGNED_IN" && session?.user) {
          const user = session.user as any;
          const metadata = user.user_metadata || {};

          // Fetch profile once to get authoritative role + agency fields
          supabase
            .from("profiles")
            .select("role, tax_id, is_active, full_name, email, phone")
            .eq("id", user.id)
            .single()
            .then((result: { data: any; error: any }) => {
              const { data: profile, error: profileError } = result;
              if (profileError || !profile?.role) {
                setMessage({
                  text: "Profile not found. Please contact support.",
                  isError: true,
                });
                setLoading(false);
                return;
              }

              const role =
                profile.role || (metadata.role as string | undefined);

              if (!role) {
                setMessage({
                  text: "Profile role missing. Please contact support.",
                  isError: true,
                });
                setLoading(false);
                return;
              }

              // Build a safe user snapshot for reuse on dashboards (no tokens).
              const safeUser = {
                id: user.id as string,
                email: profile.email ?? (user.email as string | null) ?? null,
                role,
                full_name:
                  profile.full_name ?? (metadata.full_name as string | null) ??
                  null,
                phone:
                  profile.phone ?? (metadata.phone as string | null) ?? null,
                tax_id: profile.tax_id ?? null,
                is_active: profile.is_active ?? null,
              };

              try {
                localStorage.setItem(
                  "diasporabase_user",
                  JSON.stringify(safeUser),
                );
                localStorage.setItem("diaspobase_role", role);
                localStorage.setItem("diaspobase_userId", user.id);
              } catch {
                // Swallow storage errors; do not block login
              }

              // Route to the correct dashboard, including agency gating.
              if (role === "super_admin") {
                router.replace(routes.superAdminDashboard);
              } else if (role === "admin") {
                router.replace(routes.adminDashboard);
              } else if (role === "agency") {
                if (!profile.tax_id) {
                  router.replace(routes.agencyOnboarding);
                  return;
                }
                if (!profile.is_active) {
                  router.replace(routes.approvalPending);
                  return;
                }
                router.replace(routes.agencyDashboard);
              } else if (role === "volunteer") {
                router.replace(routes.volunteerDashboard);
              } else {
                router.replace(routes.login);
              }
            });
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!isValidEmail(email)) {
      setMessage({
        text: "Please enter a valid email address.",
        isError: true,
      });
      setLoading(false);
      return;
    }
    if (!isValidPassword(password)) {
      setMessage({
        text: "Password must be at least 8 characters long.",
        isError: true,
      });
      setLoading(false);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      },
    );

    if (signInError) {
      // toast.error(signInError.message);
      setMessage({ text: signInError.message, isError: true });
      setLoading(false);
      return;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="grid gap-4" aria-live="polite">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
            />
          </div>
          {/* Password Field with Eye Toggle */}
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                className="pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm text-right hover:text-diaspora-darkBlue"
          >
            Forgot password ?
          </Link>{" "}
          <SignInWithGoogle />
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Login"
            )}
          </Button>
          {message && (
            <p
              className={`text-center text-sm ${message.isError ? "text-red-500" : "text-green-500"}`}
              aria-live="assertive"
            >
              {message.text}
            </p>
          )}
          <div className="mt-4 text-xs text-center">
            Don&apos;t have an account? <br />
            <Link href={routes.registerVolunteer} className="underline">
              Register as Volunteer
            </Link>{" "}
            or{" "}
            <Link href={routes.registerAgency} className="underline">
              Register as Agency
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
