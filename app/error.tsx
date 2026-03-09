"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { getDashboardPathForRole } from "@/lib/dashboard-path";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [dashboardPath, setDashboardPath] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const resolveDashboard = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setAuthChecked(true);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setDashboardPath(getDashboardPathForRole(profile?.role ?? null));
      setAuthChecked(true);
    };
    resolveDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/80 dark:border-gray-700 p-8 sm:p-10 text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <span className="text-2xl" aria-hidden>
              ⚠️
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-sm mx-auto">
              We hit a snag. You can try again or head back to a safe page. We’ve been notified and are looking into it.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {authChecked && dashboardPath ? (
              <Link href={dashboardPath}>
                <Button className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold shadow-lg shadow-sky-500/25">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Back to your dashboard
                </Button>
              </Link>
            ) : authChecked ? (
              <Link href="/">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold shadow-lg shadow-sky-500/25">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            ) : null}
            <Button
              variant="outline"
              onClick={reset}
              className="w-full sm:w-auto border-sky-300 dark:border-sky-600 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/30 font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
