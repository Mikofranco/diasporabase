"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Logo from "@/components/logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (type !== "recovery" || !accessToken || !refreshToken) {
      setError("This password reset link is invalid or has expired.");
      setReady(true);
      return;
    }

    supabase.auth
      .setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      .then(({ data, error }: any) => {
        if (error || !data.session) {
          setError(
            "This password reset link has expired. Please request a new one.",
          );
        }
        setReady(true);
      });
  }, [supabase.auth]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message || "Unable to update password.");
      return;
    }

    setSuccess(true);
    // setTimeout(() => router.push("/dashboard"), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md shadow-lg">
        {/* ───────── VERIFYING STATE ───────── */}
        {!ready && (
          <CardContent className="py-16 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Verifying your password reset link…
            </p>
          </CardContent>
        )}

        {/* ───────── ERROR STATE (INVALID / EXPIRED TOKEN) ───────── */}
        {ready && error && !success && (
          <CardContent className="py-12 text-center space-y-4">
            <Alert variant="destructive" className="justify-center">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <Button
              className="w-full action-btn"
              onClick={() => router.push(routes.forgotPassword)}
            >
              Request new reset link
            </Button>
          </CardContent>
        )}

        {/* ───────── SUCCESS STATE ───────── */}
        {success && (
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />
            <h2 className="text-lg font-semibold">Password updated</h2>
            <p className="text-sm text-muted-foreground">
              Your password has been changed successfully.
            </p>

            <Button
              className="w-full action-btn"
              onClick={() => router.push(routes.login)}
            >
              Go to login
            </Button>
          </CardContent>
        )}

        {/* ───────── RESET FORM ───────── */}
        {ready && !error && !success && (
          <>
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center">
                <Logo />
              </div>
              <CardTitle>Set a new password</CardTitle>
              <CardDescription>
                Choose a strong password to secure your account
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="text-sm font-medium">New password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    placeholder="At least 8 characters"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    placeholder="Repeat password"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full action-btn"
                  disabled={loading}
                >
                  {loading ? "Updating password…" : "Change password"}
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
