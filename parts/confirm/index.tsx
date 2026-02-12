"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogIn,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

const CONFIRM_TOKEN_KEY = "diasporabase_confirm_token";

type Status = "loading" | "success" | "invalid" | "expired" | "used" | "error";
type UserRole = "super_admin" | "admin" | "agency" | "volunteer" | null;

const getRedirectPath = (role: UserRole, taxId?: string | null): string => {
  if (!role) return "/login";
  const r = role.toLowerCase();
  if (r === "super_admin") return "/super-admin/dashboard";
  if (r === "admin") return "/admin/dashboard";
  if (r === "agency") {
    if (!taxId || taxId.trim() === "") return "/onboarding/agency";
    return "/agency/dashboard";
  }
  if (r === "volunteer") return "/volunteer/dashboard";
  return "/login";
};

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [tokenUserId, setTokenUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showLoginButton, setShowLoginButton] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userTaxId, setUserTaxId] = useState<string | null>(null);
  const hasVerifiedRef = useRef(false);

  const handleRedirect = useCallback(
    (role: UserRole, taxId?: string | null) => {
      const path = getRedirectPath(role, taxId);
      sessionStorage.removeItem(CONFIRM_TOKEN_KEY);
      router.push(path);
    },
    [router]
  );

  const handleGoToLogin = useCallback(() => {
    sessionStorage.removeItem(CONFIRM_TOKEN_KEY);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    if (hasVerifiedRef.current) return;

    let token: string | null = searchParams.get("token");

    if (token) {
      sessionStorage.setItem(CONFIRM_TOKEN_KEY, token);
      window.history.replaceState({}, "", "/confirm");
    } else {
      token = sessionStorage.getItem(CONFIRM_TOKEN_KEY);
    }

    if (!token) {
      setStatus("invalid");
      setMessage("No confirmation token provided.");
      return;
    }

    hasVerifiedRef.current = true;
    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc("verify_confirmation_token", {
        p_token: token,
      });

      if (error) {
        console.error("RPC Error:", error);
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
        toast.error("Verification failed.");
        sessionStorage.removeItem(CONFIRM_TOKEN_KEY);
        return;
      }

      if (!data?.valid) {
        const msg = data?.message || "invalid_token";
        sessionStorage.removeItem(CONFIRM_TOKEN_KEY);

        if (msg === "link_expired") {
          setStatus("expired");
          setMessage("This confirmation link has expired.");
        } else if (msg === "already_used") {
          setStatus("used");
          setMessage("This confirmation has been completed.");
        } else {
          setStatus("invalid");
          setMessage("Invalid or unknown confirmation link.");
        }
        return;
      }

      const confirmedUserId = data.user_id;
      setTokenUserId(confirmedUserId);
      setStatus("success");
      setMessage("Your email has been verified successfully.");
      toast.success("Your email is now verified.");

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        setCurrentUserId(null);
        setShowLoginButton(true);
        return;
      }

      const currentId = sessionData.session.user.id;
      setCurrentUserId(currentId);

      if (currentId === confirmedUserId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, tax_id")
          .eq("id", currentId)
          .single();

        const role = (profile?.role?.toLowerCase() || null) as UserRole;
        setUserRole(role);
        setUserTaxId(profile?.tax_id ?? null);

        setTimeout(() => {
          handleRedirect(role, profile?.tax_id);
        }, 3000);
      } else {
        await supabase.auth.signOut();

        // Clear local and session storage after sign out
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (err) {
          // Optionally log or handle error but don't block logout
          console.error("Error clearing storage after sign out", err);
        }
        setCurrentUserId(null);
        setShowLoginButton(true);
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setStatus("error");
      setMessage("An unexpected error occurred.");
      sessionStorage.removeItem(CONFIRM_TOKEN_KEY);
    }
  };

  const getIcon = () => {
    const iconClass = "h-14 w-14 sm:h-16 sm:w-16";
    switch (status) {
      case "loading":
        return (
          <div className={`${iconClass} rounded-full bg-sky-100 flex items-center justify-center`}>
            <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 animate-spin text-sky-600" />
          </div>
        );
      case "success":
        return (
          <div className={`${iconClass} rounded-full bg-emerald-100 flex items-center justify-center`}>
            <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" />
          </div>
        );
      case "invalid":
      case "error":
        return (
          <div className={`${iconClass} rounded-full bg-red-100 flex items-center justify-center`}>
            <XCircle className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
          </div>
        );
      case "expired":
      case "used":
        return (
          <div className={`${iconClass} rounded-full bg-amber-100 flex items-center justify-center`}>
            <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600" />
          </div>
        );
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
      return (
        <p className="text-muted-foreground">Verifying your email address...</p>
      );
    }

    return (
      <div className="space-y-6 w-full">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{getTitle()}</h2>
          <p className="text-muted-foreground text-sm sm:text-base">{message}</p>
        </div>

        {status === "success" && currentUserId === tokenUserId && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Redirecting you to your dashboard in 3 seconds...
            </p>
            <Button
              onClick={() => handleRedirect(userRole, userTaxId)}
              className="w-full"
              size="lg"
            >
              Continue now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {status === "success" && currentUserId !== tokenUserId && (
          <Button
            onClick={handleGoToLogin}
            className="w-full"
            size="lg"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Button>
        )}

        {(status === "invalid" || status === "expired" || status === "used") && (
          <div className="space-y-4">
            {status === "expired" && (
              <p className="text-sm text-muted-foreground">
                You can request a new confirmation link from the login page.
              </p>
            )}
            <Button onClick={handleGoToLogin} className="w-full" size="lg">
              <LogIn className="mr-2 h-4 w-4" />
              Go to Login
            </Button>
          </div>
        )}

        {status === "error" && (
          <Button onClick={handleGoToLogin} variant="outline" className="w-full" size="lg">
            Back to Login
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-lg border-0 sm:border">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-semibold text-foreground">
            Email Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 pb-8">
          <div className="flex flex-col items-center space-y-6 text-center">
            {getIcon()}
            {getContent()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
