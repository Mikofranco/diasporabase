"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { routes } from "@/lib/routes";

const RESEND_COOLDOWN_SEC = 120; // 2 minutes - must match API

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail((prev) => emailParam || prev);
  }, [emailParam]);

  // Countdown timer after rate limit
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/send-confirmation-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role: "volunteer" }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        toast.success("Confirmation email sent. Check your inbox.");
        return;
      }

      if (res.status === 429) {
        const wait = data.retryAfter ?? RESEND_COOLDOWN_SEC;
        setCountdown(wait);
        setError(data.message || `Please wait ${wait} seconds before trying again.`);
        return;
      }

      setError(data.error || data.message || "Failed to send email. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0ea5e9]/10 ring-4 ring-[#0ea5e9]/20">
              <CheckCircle2 className="h-8 w-8 text-[#0ea5e9]" />
            </div>
            <CardTitle className="text-xl">Email sent</CardTitle>
            <p className="text-muted-foreground text-sm">
              Check your inbox and spam folder. The link is valid for 24 hours.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full bg-[#0ea5e9] hover:bg-[#0284c7]">
              <Link href={routes.login}>Go to login</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0ea5e9]/10 ring-4 ring-[#0ea5e9]/20">
            <Mail className="h-8 w-8 text-[#0ea5e9]" />
          </div>
          <CardTitle className="text-xl">Resend confirmation email</CardTitle>
          <p className="text-muted-foreground text-sm">
            Enter the email you used to register. We’ll send a new confirmation link (once every 2 minutes).
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-email-input">Email</Label>
              <Input
                id="confirm-email-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || countdown > 0}
                autoComplete="email"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {countdown > 0 && (
              <p className="text-sm text-muted-foreground">
                You can request another email in <strong>{countdown}</strong> seconds.
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-[#0ea5e9] hover:bg-[#0284c7]"
              disabled={loading || countdown > 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Wait ${countdown}s`
              ) : (
                "Send confirmation email"
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href={routes.login} className="text-[#0ea5e9] hover:underline">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
