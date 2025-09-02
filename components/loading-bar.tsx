// components/loading-bar.tsx
'use client';

import { useEffect } from 'react';

export default function LoadingBar() {
  useEffect(() => {
    // Example: Add client-side logic for progress bar (e.g., nprogress)
    // Replace with your actual implementation
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-blue-600 animate-pulse z-50" />
  );
}