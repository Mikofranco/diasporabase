// app/layout.tsx   or   components/providers/AuthProvider.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { routes } from '@/lib/routes';
import { ro } from 'date-fns/locale';

export default function AuthListenerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Listen for auth changes (fires after OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event:any, session:any) => {
      console.log('Auth event:', event); // debug

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, tax_id')
            .eq('id', session.user.id)
            .single();

          if (error || !profile) {
            console.error('Profile fetch failed:', error);
            toast.error('Could not load profile. Please try again.');
            router.replace(routes.login + '?error=profile_failed');
            return;
          }

          const role = profile.role;

          // Only redirect if we're on a public/auth page to avoid loops
          const isPublicPage =
            pathname === routes.home ||
            pathname === routes.login ||
            pathname?.startsWith('/auth');

          if (isPublicPage) {
            if (role === 'super_admin') {
              router.replace(routes.superAdminDashboard);
            } else if (role === 'admin') {
              router.replace(routes.adminDashboard);
            } else if (role === 'agency') {
              if (!profile.tax_id || profile.tax_id.trim() === '') {
                router.replace(routes.agencyOnboarding);
              } else {
                router.replace(routes.agencyDashboard);
              }
            } else if (role === 'volunteer') {
              router.replace(routes.volunteerDashboard);
            } else {
              router.replace(routes.home); // fallback
            }
          }
        } catch (err) {
          console.error('Auth callback error:', err);
          toast.error('Login failed. Please try again.');
          router.replace(routes.login + '?error=callback_error');
        }
      }

      // Optional: handle SIGNED_OUT, TOKEN_REFRESHED, etc.
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  return <>{children}</>;
}