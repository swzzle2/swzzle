'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Supabase auto-detects the hash fragment and sets the session
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/account');
      }
    });

    // Also check if already signed in (session already set)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push('/account');
      }
    });
  }, [router, supabase.auth]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-display text-sm tracking-wider">
          Signing you in...
        </p>
      </div>
    </div>
  );
}
