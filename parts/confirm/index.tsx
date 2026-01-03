"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { decryptJWT } from "@/lib/jwt";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle, LogIn } from "lucide-react";
import { toast } from "sonner";

type Status = "loading" | "success" | "invalid" | "expired" | "used" | "error";

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("invalid");
      setMessage("No confirmation token found.");
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      // 1. Decrypt & validate JWT
      const payload = await decryptJWT(token);

      if (payload.purpose !== "email_confirmation") {
        setStatus("invalid");
        setMessage("Invalid token purpose.");
        return;
      }

      const { userId } = payload;

      // 2. Fetch the confirmation link record
      const { data: link, error: fetchError } = await supabase
        .from("confirmation_links")
        .select("id, used, clicked_at, expires_at")
        .eq("token_hash", token)
        .single();

      if (fetchError || !link) {
        setStatus("invalid");
        setMessage("Invalid or unknown confirmation link.");
        return;
      }

      // 3. Record the click
      if (!link.clicked_at) {
        const { error: clickError } = await supabase
          .from("confirmation_links")
          .update({ clicked_at: new Date().toISOString() })
          .eq("id", link.id);

        if (clickError) console.error("Failed to record click:", clickError);
      }

      // 4. Check status
      if (link.used) {
        setStatus("used");
        setMessage("This link has already been used.");
        return;
      }

      const now = new Date();
      const expires = new Date(link.expires_at);
      if (now > expires) {
        setStatus("expired");
        setMessage("This confirmation link has expired.");
        return;
      }

      // 5. Mark as used
      const { error: updateError } = await supabase
        .from("confirmation_links")
        .update({
          used: true,
          clicked_at: new Date().toISOString(),
        })
        .eq("id", link.id);

      if (updateError) throw updateError;

      // 6. Confirm email + get role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .update({ email_confirmed: true })
        .eq("id", userId)
        .select("role")
        .single();

      if (profileError) throw profileError;

      // Success
      setStatus("success");
      setMessage("Email confirmed successfully!");
      toast.success("Welcome! Your email is verified.");

      // Role-based redirect
      const role = profile.role?.toLowerCase();
      let redirectPath = "/dashboard";

      if (role === "agency") {
        redirectPath = "/onboarding";
      } else if (role === "volunteer") {
        redirectPath = "/dashboard/volunteer";
      }

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push(redirectPath);
      }, 3000);

    } catch (err: any) {
      console.error("Verification failed:", err);
      setStatus("error");
      setMessage(err.message || "Verification failed. Please try again.");
      toast.error("Could not verify email.");
    }
  };

  const getContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg">Verifying your email...</p>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center space-y-6 text-green-600">
            <CheckCircle className="h-16 w-16" />
            <div className="text-center">
              <p className="text-xl font-semibold">{message}</p>
              <p className="text-sm text-muted-foreground mt-3">
                Redirecting to your dashboard in 3 seconds...
              </p>
            </div>
            {/* <Button onClick={() => router.push("/login")} size="lg" className="w-full max-w-xs">
              <LogIn className="mr-2 h-5 w-5" />
              Go to Login Now
            </Button> */}
          </div>
        );

      case "invalid":
      case "expired":
      case "used":
        return (
          <div className="flex flex-col items-center space-y-6 text-amber-600">
            <AlertCircle className="h-16 w-16" />
            <div className="text-center">
              <p className="text-xl font-semibold">{message}</p>
              <p className="text-sm text-muted-foreground mt-3">
                You may need a new confirmation link.
              </p>
            </div>
            <div className="space-y-3 w-full max-w-xs">
              <Button
                onClick={() => router.push("/resend-confirmation")}
                variant="outline"
                className="w-full"
              >
                Resend Confirmation Email
              </Button>
              <Button onClick={() => router.push("/login")} className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Go to Login
              </Button>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center space-y-6 text-red-600">
            <XCircle className="h-16 w-16" />
            <div className="text-center">
              <p className="text-xl font-semibold">{message}</p>
              <p className="text-sm text-muted-foreground mt-3">
                Something went wrong.
              </p>
            </div>
            <div className="space-y-3 w-full max-w-xs">
              <Button onClick={() => router.push("/support")} variant="outline" className="w-full">
                Contact Support
              </Button>
              <Button onClick={() => router.push("/login")} className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Go to Login
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === "loading" ? "Confirming Email" : "Email Confirmation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center">{getContent()}</div>
        </CardContent>
      </Card>
    </div>
  );
}