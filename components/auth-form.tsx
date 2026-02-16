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
import { Loader2, Eye, EyeOff, Mail } from "lucide-react";
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
    unconfirmedEmail?: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false); // NEW: toggle state
  const router = useRouter();
  const supabase = createClient();

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password: string) => password.length >= 8;

  useEffect(() => {
    //@ts-ignore
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (event === "SIGNED_IN" && session?.user) {
          supabase
            .from("profiles")
            .select("role, is_active, tax_id")
            .eq("id", session.user.id)
            .single()
            //@ts-ignore
            .then(({ data: profile, error: profileError }) => {
              if (profileError || !profile?.role) {
                setMessage({
                  text: "Profile not found. Please contact support.",
                  isError: true,
                });
                setLoading(false);
                return;
              }
              // toast.success("Logged in successfully!");
              localStorage.setItem("diaspobase_role", profile.role);
              localStorage.setItem("diaspobase_userId", session.user.id);

              if (profile.role === "super_admin") {
                router.replace(routes.superAdminDashboard);
              } else if (profile.role === "admin") {
                router.replace(routes.adminDashboard);
              } else if (profile.role === "agency") {
                if (!profile.tax_id) {
                  router.replace(routes.agencyOnboarding);
                  return;
                }
                if (!profile.is_active) {
                  router.replace(routes.approvalPending);
                  return;
                }
                router.replace(routes.agencyDashboard);
              } else if (profile.role === "volunteer") {
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
      const isUnconfirmed =
        signInError.message?.toLowerCase().includes("email not confirmed") ||
        signInError.message?.toLowerCase().includes("email_not_confirmed");
      setMessage({
        text: signInError.message,
        isError: true,
        ...(isUnconfirmed ? { unconfirmedEmail: email } : {}),
      });
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
            <div className="space-y-2" aria-live="assertive">
              <p
                className={`text-center text-sm ${message.isError ? "text-red-500" : "text-green-500"}`}
              >
                {message.text}
              </p>
              {message.unconfirmedEmail && (
                <div className="flex flex-col items-center gap-2">
                  <Link
                    href={`${routes.confirmEmail}?email=${encodeURIComponent(message.unconfirmedEmail)}`}
                    className="inline-flex items-center gap-2 rounded-md border border-[#0ea5e9] bg-[#0ea5e9]/5 px-3 py-2 text-sm font-medium text-[#0ea5e9] hover:bg-[#0ea5e9]/10"
                  >
                    <Mail className="h-4 w-4" />
                    Resend confirmation email
                  </Link>
                </div>
              )}
            </div>
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
