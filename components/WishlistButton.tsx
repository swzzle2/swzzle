'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';

export function WishlistButton({ productId }: { productId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    async function checkWishlist() {
      try {
        const res = await fetch('/api/customer/wishlist');
        if (res.ok) {
          const data = await res.json();
          setWishlisted(data.wishlist.includes(productId));
        }
      } catch {
        // silently fail
      }
    }
    checkWishlist();
  }, [authReady, user, productId]);

  async function toggle() {
    if (!user) {
      window.location.href = '/auth/signin';
      return;
    }

    setLoading(true);
    try {
      const method = wishlisted ? 'DELETE' : 'POST';
      const res = await fetch('/api/customer/wishlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setWishlisted(!wishlisted);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="group relative p-2 rounded-full transition-all duration-200 hover:bg-neon-red/10 disabled:opacity-50"
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      title={!user ? 'Sign in to save to wishlist' : wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        className={`w-5 h-5 transition-colors duration-200 ${
          wishlisted
            ? 'text-neon-red fill-neon-red'
            : 'text-gray-500 fill-none group-hover:text-neon-red'
        }`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  );
}
