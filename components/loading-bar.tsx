'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NProgress from 'nprogress'; 
import 'nprogress/nprogress.css';

export default function LoadingBar() {
  const router = useRouter();

  useEffect(() => {
    NProgress.configure({
      showSpinner: false, 
      trickleSpeed: 200, 
      minimum: 0.1, 
      easing: 'ease',
      speed: 500,
    });

    const handleStart = () => NProgress.start();
    const handleDone = () => NProgress.done();

    window.addEventListener('routeChangeStart', handleStart);
    window.addEventListener('routeChangeComplete', handleDone);
    window.addEventListener('routeChangeError', handleDone);

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
          background: linear-gradient(to right, #3b82f6, #60a5fa); 
          height: 4px; 
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); 
          transition: width 0.3s ease-in-out; 
        }
        #nprogress .peg {
          display: none; 
        }
      `}</style>
    </div>
  );
}