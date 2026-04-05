'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link
            href="/"
            className="font-display font-black text-3xl tracking-wider text-foreground hover:text-neon-cyan transition-colors"
          >
            SWZZLE
          </Link>
          <p className="text-gray-500 text-sm mt-3">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-neon-red/10 border border-neon-red/20 rounded-lg p-3 text-sm text-neon-red text-center">
            {error}
          </div>
        )}

        {magicLinkSent ? (
          <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg p-6 text-center space-y-3">
            <svg
              className="w-10 h-10 text-neon-cyan mx-auto"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-foreground font-display text-sm uppercase tracking-wider">
              Check your email
            </p>
            <p className="text-gray-400 text-sm">
              We sent a magic link to <span className="text-foreground">{email}</span>
            </p>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="text-xs text-neon-cyan hover:underline mt-2"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            {/* Magic link form */}
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs text-gray-500 mb-1.5 font-body"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-background border border-border rounded px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors placeholder:text-gray-600"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full border-2 border-neon-cyan text-neon-cyan font-display font-bold uppercase tracking-wider px-4 py-2.5 rounded hover:bg-neon-cyan/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-xs text-gray-600">
          <Link href="/" className="text-neon-cyan hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
