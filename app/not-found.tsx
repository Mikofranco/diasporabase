"use client";

import { useEffect, useState } from "react";
import { Home, Compass, ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { getDashboardPathForRole } from "@/lib/dashboard-path";

export default function NotFound() {
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-sky-950 flex items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/5 w-72 h-72 bg-sky-200/40 dark:bg-sky-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/6 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-sky-100/50 dark:bg-sky-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-sky-100/50 dark:shadow-none border border-sky-100/80 dark:border-gray-700 p-8 sm:p-10 text-center space-y-6">
          <div className="flex justify-center gap-1">
            <span className="text-6xl sm:text-7xl font-extrabold text-sky-500 dark:text-sky-400 drop-shadow-sm">4</span>
            <span className="text-6xl sm:text-7xl font-extrabold text-sky-600 dark:text-sky-300 drop-shadow-sm animate-bounce" style={{ animationDuration: "2s" }}>0</span>
            <span className="text-6xl sm:text-7xl font-extrabold text-sky-500 dark:text-sky-400 drop-shadow-sm">4</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
              Oops! This page took a wrong turn
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-sm mx-auto">
              We looked everywhere — this page doesn’t exist or has moved. No worries though!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {authChecked && dashboardPath ? (
              <>
                <Link href={dashboardPath}>
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold shadow-lg shadow-sky-500/25 transition-all hover:shadow-sky-500/40 hover:-translate-y-0.5">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Back to your dashboard
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full sm:w-auto border-sky-300 dark:border-sky-600 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/30 font-medium">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </Link>
              </>
            ) : authChecked ? (
              <>
                <Link href="/">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold shadow-lg shadow-sky-500/25 transition-all hover:shadow-sky-500/40 hover:-translate-y-0.5">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button variant="outline" className="w-full sm:w-auto border-sky-300 dark:border-sky-600 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/30 font-medium">
                    <Compass className="w-4 h-4 mr-2" />
                    Explore projects
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
                <div className="h-10 w-32 bg-sky-100 dark:bg-sky-900/30 rounded-md animate-pulse mx-auto sm:mx-0" />
                <div className="h-10 w-32 bg-sky-100 dark:bg-sky-900/30 rounded-md animate-pulse mx-auto sm:mx-0" />
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-6">
          Need help? <Link href="/contact" className="text-sky-600 dark:text-sky-400 hover:underline font-medium">Contact us</Link>
        </p>
      </div>
    </div>
  );
}
