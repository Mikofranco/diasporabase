// components/LoadingBar.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function LoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(true);
    // Simulate route change completion with a small delay
    const timer = setTimeout(() => setIsLoading(false), 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return isLoading ? (
    <div className="fixed top-0 left-0 w-full h-1 bg-blue-500 animate-loading z-50" />
  ) : null;
}