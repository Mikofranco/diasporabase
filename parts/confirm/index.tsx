"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { decryptJWT } from "@/lib/jwt";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";

type Status = "loading" | "success" | "invalid" | "expired" | "used" | "error";

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const urlStatus = searchParams.get("status");
    const loginToken = searchParams.get("loginToken");

    if (urlStatus === "success" && loginToken) {
      handleAutoLogin(loginToken);
    } else if (urlStatus === "expired") {
      setStatus("error");
      setMessage("This confirmation link has expired.");
    } else if (urlStatus === "invalid" || urlStatus === "used") {
      setStatus("error");
      setMessage("This link is invalid or has already been used.");
    } else if (urlStatus === "error") {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    } else {
      setStatus("error");
      setMessage("Invalid confirmation link.");
    }
  }, [searchParams]);

  const handleAutoLogin = async (token: string) => {
    try {
      setStatus("loading");
      setMessage("Logging you in...");

      const payload = await decryptJWT(token);
      if (payload.purpose !== "direct_login") throw new Error("Invalid token");

      // Use Supabase passwordless login with custom token
      const { data, error } = await supabase.auth.signInWithOtp({
        email: payload.email,
        options: {
          data: { direct_login_token: token },
        },
      });

      if (error) throw error;

      toast.success("Logged in successfully!");
      setStatus("success");
      setMessage("Welcome back!");

      // Redirect based on role (fetch from profile or payload if you added it)
      setTimeout(() => {
        router.push("/dashboard"); // or role-based
      }, 2000);
    } catch (err) {
      console.error("Auto-login failed:", err);
      setStatus("error");
      setMessage("Login failed. Please log in manually.");
      toast.error("Auto-login failed");
    }
  };

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("invalid");
      setMessage("No confirmation token found in the URL.");
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      // 1. Decrypt and validate custom JWT
      const payload = await decryptJWT(token);

      if (payload.purpose !== "email_confirmation") {
        setStatus("invalid");
        setMessage("This link is not valid for email confirmation.");
        return;
      }

      const { userId } = payload;

      // 2. Fetch confirmation link record — avoid .single() to prevent PGRST116
      const { data: links, error: fetchError } = await supabase
        .from("confirmation_links")
        .select("id, used, clicked_at, expires_at")
        .eq("token_hash", token);

      if (fetchError) {
        console.error("Database error fetching link:", fetchError);
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
        return;
      }

      if (!links || links.length === 0) {
        setStatus("invalid");
        setMessage("This confirmation link is invalid or no longer exists.");
        return;
      }

      const link = links[0];

      // 3. Record click if not already
      if (!link.clicked_at) {
        const { error: clickError } = await supabase
          .from("confirmation_links")
          .update({ clicked_at: new Date().toISOString() })
          .eq("id", link.id);

        if (clickError) console.error("Failed to record click:", clickError);
      }

      // 4. Check token status
      if (link.used) {
        setStatus("used");
        setMessage("This confirmation link has already been used.");
        return;
      }

      const now = Date.now();
      const expiresAt = new Date(link.expires_at).getTime();

      if (now > expiresAt) {
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

      if (updateError) {
        console.error("Failed to mark link as used:", updateError);
        throw updateError;
      }

      // 6. Confirm email in profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .update({ email_confirmed: true })
        .eq("id", userId)
        .select("role")
        .single();

      if (profileError || !profile) {
        console.error("Failed to confirm email:", profileError);
        setStatus("error");
        setMessage("Failed to confirm your email. Please contact support.");
        return;
      }

      // SUCCESS!
      setStatus("success");
      setMessage("Email confirmed successfully!");
      toast.success("Welcome! Your email is now verified.");

      // Role-based redirect
      const role = profile.role?.toLowerCase() || "";
      let redirectPath = "/login";

      if (role === "agency") {
        redirectPath = "/onboarding";
      } else if (role === "volunteer") {
        redirectPath = "/dashboard/volunteer";
      }

      // Give user feedback before redirect
      setTimeout(() => {
        router.push(redirectPath);
      }, 3000);
    } catch (err: any) {
      console.error("Email verification failed:", err);
      setStatus("error");
      setMessage(err.message || "Verification failed. Please try again.");
      toast.error("Could not verify your email.");
    }
  };

  const getContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg">Verifying your email address...</p>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center space-y-6 text-green-600">
            <CheckCircle className="h-16 w-16" />
            <div className="text-center space-y-3">
              <p className="text-2xl font-bold">{message}</p>
              <p className="text-muted-foreground">
                You are being redirected to your dashboard...
              </p>
            </div>
          </div>
        );

      case "expired":
        return (
          <div className="flex flex-col items-center space-y-6 text-amber-600">
            <AlertCircle className="h-16 w-16" />
            <div className="text-center space-y-3">
              <p className="text-xl font-semibold">{message}</p>
              <p className="text-muted-foreground">
                Please request a new confirmation link.
              </p>
            </div>
            <div className="w-full max-w-xs space-y-3">
              <Button
                onClick={() => router.push("/resend-confirmation")}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                Resend Confirmation Email
              </Button>
              <Button onClick={() => router.push("/login")} variant="outline" className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Go to Login
              </Button>
            </div>
          </div>
        );

      case "used":
      case "invalid":
        return (
          <div className="flex flex-col items-center space-y-6 text-amber-600">
            <AlertCircle className="h-16 w-16" />
            <div className="text-center space-y-3">
              <p className="text-xl font-semibold">{message}</p>
              <p className="text-muted-foreground">
                You may already be verified.
              </p>
            </div>
            <Button onClick={() => router.push("/login")} className="w-full max-w-xs">
              <LogIn className="mr-2 h-4 w-4" />
              Go to Login
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center space-y-6 text-red-600">
            <XCircle className="h-16 w-16" />
            <div className="text-center space-y-3">
              <p className="text-xl font-semibold">{message}</p>
              <p className="text-muted-foreground">
                Please try again or contact support.
              </p>
            </div>
            <div className="w-full max-w-xs space-y-3">
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
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold text-slate-800">
            {status === "loading" ? "Confirming..." : "Email Confirmation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center">{getContent()}</div>
        </CardContent>
      </Card>
    </div>
  );
}