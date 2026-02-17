"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogIn,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { routes } from "@/lib/routes";
import { signOutUser } from "@/lib/utils";

const CONFIRM_TOKEN_KEY = "diasporabase_confirm_token";
const REDIRECT_DELAY_SEC = 3;

type Status = "loading" | "success" | "invalid" | "expired" | "used" | "error";
type UserRole = "super_admin" | "admin" | "agency" | "volunteer" | null;

const getRedirectPath = (role: UserRole, taxId?: string | null): string => {
  if (!role) return routes.login;
  const r = role.toLowerCase();
  if (r === "super_admin") return routes.superAdminDashboard;
  if (r === "admin") return routes.adminDashboard;
  if (r === "agency") {
    if (!taxId || taxId.trim() === "") return routes.agencyOnboarding;
    return routes.agencyDashboard;
  }
  if (r === "volunteer") return routes.volunteerDashboard;
  return routes.login;
};

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [tokenUserId, setTokenUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userTaxId, setUserTaxId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
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
    router.push(routes.login);
  }, [router]);

  // Countdown for auto-redirect
  useEffect(() => {
    if (status !== "success" || currentUserId !== tokenUserId) return;

    setCountdown(REDIRECT_DELAY_SEC);
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(id);
          return prev;
        }
        return prev - 1;
      });
    }, 1000);

    const timeout = setTimeout(() => {
      handleRedirect(userRole, userTaxId);
    }, REDIRECT_DELAY_SEC * 1000);

    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, [
    status,
    currentUserId,
    tokenUserId,
    userRole,
    userTaxId,
    handleRedirect,
  ]);

  useEffect(() => {
    if (hasVerifiedRef.current) return;

    let token: string | null = searchParams.get("token");

    if (token) {
      sessionStorage.setItem(CONFIRM_TOKEN_KEY, token);
      window.history.replaceState({}, "", routes.confirmation);
    } else {
      token = sessionStorage.getItem(CONFIRM_TOKEN_KEY);
    }

    if (!token) {
      setStatus("invalid");
      setMessage("No confirmation token was provided.");
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
          setMessage("This confirmation has already been completed.");
        } else {
          setStatus("invalid");
          setMessage("This link is invalid or could not be recognized.");
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
      } else {
        const result = await signOutUser();
        if (!result.success) {
          console.error("Error clearing session after token mismatch:", result.error);
        }
        setCurrentUserId(null);
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setStatus("error");
      setMessage("An unexpected error occurred. Please try again.");
      sessionStorage.removeItem(CONFIRM_TOKEN_KEY);
    }
  };

  const iconSize = "h-20 w-20";
  const iconInnerSize = "h-10 w-10";

  const getIcon = () => {
    switch (status) {
      case "loading":
        return (
          <div
            className={`${iconSize} mx-auto flex items-center justify-center rounded-full bg-[#0ea5e9]/10 ring-4 ring-[#0ea5e9]/20`}
          >
            <Loader2
              className={`${iconInnerSize} animate-spin text-[#0ea5e9]`}
              strokeWidth={2}
            />
          </div>
        );
      case "success":
        return (
          <div
            className={`${iconSize} mx-auto flex items-center justify-center rounded-full bg-[#0ea5e9]/10 ring-4 ring-[#0ea5e9]/20`}
          >
            <CheckCircle2
              className={`${iconInnerSize} text-[#0ea5e9]`}
              strokeWidth={2.25}
            />
          </div>
        );
      case "invalid":
      case "error":
        return (
          <div
            className={`${iconSize} mx-auto flex items-center justify-center rounded-full bg-red-100 ring-4 ring-red-100 dark:bg-red-950/30 dark:ring-red-950/50`}
          >
            <XCircle
              className={`${iconInnerSize} text-red-600 dark:text-red-400`}
              strokeWidth={2}
            />
          </div>
        );
      case "expired":
      case "used":
        return (
          <div
            className={`${iconSize} mx-auto flex items-center justify-center rounded-full bg-amber-100 ring-4 ring-amber-100 dark:bg-amber-950/30 dark:ring-amber-950/50`}
          >
            <AlertCircle
              className={`${iconInnerSize} text-amber-600 dark:text-amber-400`}
              strokeWidth={2}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    if (status === "success") {
      if (currentUserId && currentUserId === tokenUserId) return "Welcome back!";
      return "Email verified";
    }
    if (status === "used") return "Already confirmed";
    if (status === "expired") return "Link expired";
    if (status === "invalid") return "Invalid link";
    if (status === "error") return "Verification failed";
    return "Confirming your email";
  };

  const primaryBtnClass =
    "w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-medium";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/50 p-4 sm:p-6">
      <Card className="w-full max-w-md overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xl">
        <CardContent className="p-6 sm:p-8">
          <div
            key={status}
            className="flex flex-col items-center space-y-6 text-center animate-in fade-in-50 duration-300"
          >
            {getIcon()}

            <div className="space-y-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {getTitle()}
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base leading-relaxed">
                {status === "loading"
                  ? "Verifying your email address..."
                  : message}
              </p>
            </div>

            {/* Success + logged in: redirect countdown + continue now */}
            {status === "success" && currentUserId === tokenUserId && (
                <div className="w-full space-y-4">
                  {countdown !== null && (
                    <p className="text-sm text-muted-foreground">
                      Redirecting in{" "}
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0ea5e9]/10 font-semibold text-[#0ea5e9] tabular-nums">
                        {countdown}
                      </span>{" "}
                      {countdown === 1 ? "second" : "seconds"}…
                    </p>
                  )}
                  <Button
                    onClick={() => handleRedirect(userRole, userTaxId)}
                    className={primaryBtnClass}
                    size="lg"
                  >
                    Continue now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

            {/* Success + not logged in: Login */}
            {status === "success" && currentUserId !== tokenUserId && (
              <Button
                onClick={handleGoToLogin}
                className={primaryBtnClass}
                size="lg"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign in to your account
              </Button>
            )}

            {/* Invalid / Expired / Used */}
            {(status === "invalid" || status === "expired" || status === "used") && (
              <div className="w-full space-y-4">
                {status === "expired" && (
                  <p className="text-sm text-muted-foreground">
                    You can request a new confirmation link from the{" "}
                    <a
                      href={routes.login}
                      className="font-medium text-[#0ea5e9] hover:underline"
                    >
                      login page
                    </a>
                    .
                  </p>
                )}
                {status === "invalid" && (
                  <p className="text-sm text-muted-foreground">
                    Please try logging in or register again from the login page.
                  </p>
                )}
                <Button
                  onClick={handleGoToLogin}
                  className={primaryBtnClass}
                  size="lg"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Go to login
                </Button>
              </div>
            )}

            {/* Error */}
            {status === "error" && (
              <Button
                onClick={handleGoToLogin}
                className={primaryBtnClass}
                size="lg"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Go to login
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
