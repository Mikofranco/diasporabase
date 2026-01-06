"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";

type Status = "loading" | "success" | "invalid" | "expired" | "used" | "error";

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [tokenUserId, setTokenUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showLoginButton, setShowLoginButton] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("invalid");
      setMessage("No confirmation token provided.");
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      const { data, error } = await supabase
        .rpc("verify_confirmation_token", { p_token: token });

      if (error) {
        console.error("RPC Error:", error);
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
        toast.error("Verification failed.");
        return;
      }

      if (!data?.valid) {
        const msg = data?.message || "invalid_token";

        if (msg === "link_expired") {
          setStatus("expired");
          setMessage("This confirmation link has expired.");
        } else if (msg === "already_used") {
          setStatus("used");
          setMessage("This confirmation link has already been used.");
        } else {
          setStatus("invalid");
          setMessage("Invalid or unknown confirmation link.");
        }

        // toast.error("Email confirmation failed.");
        return;
      }

      // SUCCESS: Email confirmed successfully
      const confirmedUserId = data.user_id;
      setTokenUserId(confirmedUserId);

      setStatus("success");
      setMessage("Email confirmed successfully!");
      toast.success("Your email is now verified.");

      // Check current session
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        // No one logged in → show login button
        setCurrentUserId(null);
        setShowLoginButton(true);
        return;
      }

      const currentId = sessionData.session.user.id;
      setCurrentUserId(currentId);

      if (currentId === confirmedUserId) {
        // Correct user is logged in → redirect to dashboard
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentId)
          .single();

        let redirectPath = "/dashboard";
        const role = profile?.role?.toLowerCase();
        if (role === "agency") redirectPath = "/onboarding";
        else if (role === "volunteer") redirectPath = "/dashboard/volunteer";

        toast.success("Welcome back! Redirecting to your dashboard...");
        setTimeout(() => router.push(redirectPath), 3000);
      } else {
        // Wrong user logged in → silently sign out
        await supabase.auth.signOut();
        setCurrentUserId(null);
        setShowLoginButton(true);
        // No toast or message about logout — user doesn't need to know
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setStatus("error");
      setMessage("An unexpected error occurred.");
      toast.error("Could not verify email.");
    }
  };

  const getIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-16 w-16 animate-spin text-primary" />;
      case "success":
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case "invalid":
      case "expired":
      case "used":
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case "error":
        return <XCircle className="h-16 w-16 text-red-600" />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    if (status === "success") {
      if (currentUserId && currentUserId === tokenUserId) return "Welcome Back!";
      return "Email Verified Successfully!";
    }
    if (status === "used") return "Already Confirmed";
    if (status === "expired") return "Link Expired";
    if (status === "invalid") return "Invalid Link";
    if (status === "error") return "Verification Failed";
    return "Confirming Your Email";
  };

  const getContent = () => {
    if (status === "loading") {
      return <p className="text-lg">Verifying your email address...</p>;
    }

    return (
      <>
        <div className="text-center space-y-4">
          <p className="text-xl font-semibold">{getTitle()}</p>
          <p className="text-muted-foreground max-w-sm mx-auto">{message}</p>
        </div>

        {/* Auto-redirect only when correct user is logged in */}
        {status === "success" && currentUserId && currentUserId === tokenUserId && (
          <p className="text-sm text-muted-foreground mt-4">
            Redirecting you to your dashboard in 3 seconds...
          </p>
        )}

        {/* Show login button when needed (not logged in OR silently logged out) */}
        {status === "success" && showLoginButton && (
          <div className="space-y-4 mt-6 w-full max-w-xs">
            <p className="text-sm text-muted-foreground">
              Log in to access your account.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full action-btn"
              size="lg"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Log In Now
            </Button>
          </div>
        )}

        {/* Invalid / Expired / Used */}
        {(status === "invalid" || status === "expired" || status === "used") && (
          <div className="space-y-4 mt-6 w-full max-w-xs">
            {status === "expired" && (
              <p className="text-sm text-muted-foreground">
                You can request a new link from the login page.
              </p>
            )}
            <Button
              onClick={() => router.push("/login")}
              className="w-full action-btn"
              size="lg"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Go to Login
            </Button>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <Button
            onClick={() => router.push("/login")}
            variant="outline"
            className="mt-6 action-btn"
          >
            Back to Login
          </Button>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Email Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-8 text-center">
            {getIcon()}
            {getContent()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}