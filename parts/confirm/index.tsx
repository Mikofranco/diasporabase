"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { decryptJWT } from "@/lib/jwt";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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

      const { userId, email } = payload;

      // 2. Check if already used or expired
      const { data: link, error: fetchError } = await supabase
        .from("confirmation_links")
        .select("used, expires_at")
        .eq("token_hash", token)
        .single();

      if (fetchError || !link) {
        setStatus("invalid");
        setMessage("Invalid or unknown confirmation link.");
        return;
      }

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

      // 3. Mark as used + confirm user
      const { error: updateError } = await supabase
        .from("confirmation_links")
        .update({ used: true })
        .eq("token_hash", token);

      if (updateError) throw updateError;

      // Optional: Update user profile
      await supabase
        .from("profiles")
        .update({ email_confirmed: true })
        .eq("id", userId);

      // 4. Success
      setStatus("success");
      setMessage("Email confirmed successfully!");

      toast.success("Welcome! Your email is verified.");

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/volunteer/dashboard");
      }, 2000);
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
          <div className="flex flex-col items-center space-y-4 text-green-600">
            <CheckCircle className="h-16 w-16" />
            <p className="text-xl font-semibold">{message}</p>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        );

      case "invalid":
      case "expired":
      case "used":
        return (
          <div className="flex flex-col items-center space-y-4 text-amber-600">
            <AlertCircle className="h-16 w-16" />
            <p className="text-xl font-semibold">{message}</p>
            <Button
              onClick={() => router.push("/resend-confirmation")}
              variant="outline"
            >
              Resend Confirmation Email
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center space-y-4 text-red-600">
            <XCircle className="h-16 w-16" />
            <p className="text-xl font-semibold">{message}</p>
            <Button onClick={() => router.push("/support")} variant="outline">
              Contact Support
            </Button>
          </div>
        );
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