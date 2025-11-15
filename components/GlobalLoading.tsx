// components/ui/GlobalLoading.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const router = useRouter();
  const startTimeRef = useRef<number | null>(null);
  const minTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleStart = () => {
      startTimeRef.current = Date.now();
      setIsLoading(true);
      setMinTimeElapsed(false);

      // Enforce 3-second minimum
      minTimerRef.current = setTimeout(() => {
        setMinTimeElapsed(true);
      }, 3000);
    };

    const handleStop = () => {
      const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;

      // Only hide if 3 seconds have passed
      if (elapsed >= 3000) {
        setIsLoading(false);
        setMinTimeElapsed(true);
      } else {
        // Wait remaining time
        const remaining = 3000 - elapsed;
        setTimeout(() => {
          setIsLoading(false);
          setMinTimeElapsed(true);
        }, remaining);
      }
    };

    // Listen to navigation events
    router.events?.on("routeChangeStart", handleStart);
    router.events?.on("routeChangeComplete", handleStop);
    router.events?.on("routeChangeError", handleStop);

    // Cleanup
    return () => {
      router.events?.off("routeChangeStart", handleStart);
      router.events?.off("routeChangeComplete", handleStop);
      router.events?.off("routeChangeError", handleStop);

      if (minTimerRef.current) {
        clearTimeout(minTimerRef.current);
      }
    };
  }, [router.events]);

  // Handle initial page load (hard refresh)
  useEffect(() => {
    if (document.readyState === "complete") {
      // Page already loaded — show for 3s anyway
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      const handleLoad = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 3000);
      };
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  // Only show if loading AND 3s not yet elapsed
  if (!isLoading || minTimeElapsed) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Loader2 className="h-14 w-14 animate-spin text-blue-600" />
          <div className="absolute inset-0 -m-3 animate-ping rounded-full border-4 border-blue-200 opacity-75"></div>
        </div>
        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}