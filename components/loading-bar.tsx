// components/loading-bar.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NProgress from 'nprogress'; 
import 'nprogress/nprogress.css';

export default function LoadingBar() {
  const router = useRouter();

  useEffect(() => {
    // Configure NProgress
    NProgress.configure({
      showSpinner: false, // Disable spinner for cleaner look
      trickleSpeed: 200, // Speed of progress trickle
      minimum: 0.1, // Minimum progress percentage
      easing: 'ease', // Animation easing
      speed: 500, // Animation speed
    });

    // Bind NProgress to Next.js router events
    const handleStart = () => NProgress.start();
    const handleDone = () => NProgress.done();

    // Listen to route change events
    window.addEventListener('routeChangeStart', handleStart);
    window.addEventListener('routeChangeComplete', handleDone);
    window.addEventListener('routeChangeError', handleDone);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('routeChangeStart', handleStart);
      window.removeEventListener('routeChangeComplete', handleDone);
      window.removeEventListener('routeChangeError', handleDone);
    };
  }, [router]);

  return (
    <div
      className="fixed top-0 left-0 w-full h-1 z-50"
      role="progressbar"
      aria-label="Page loading indicator"
      aria-live="polite"
      aria-busy="true"
    >
      {/* NProgress injects its own bar via #nprogress; no additional markup needed */}
      <style jsx global>{`
        #nprogress .bar {
          background: linear-gradient(to right, #3b82f6, #60a5fa); /* Gradient blue */
          height: 4px; /* Slightly thicker bar */
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); /* Subtle glow */
          transition: width 0.3s ease-in-out; /* Smooth progress transition */
        }
        #nprogress .peg {
          display: none; /* Hide default peg for cleaner look */
        }
      `}</style>
    </div>
  );
}