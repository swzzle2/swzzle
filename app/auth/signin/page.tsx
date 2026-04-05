'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push('/account');
    }
    setLoading(false);
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address first');
      return;
    }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    });

    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  }

  if (resetSent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg p-6 space-y-3">
            <svg className="w-10 h-10 text-neon-cyan mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-foreground font-display text-sm uppercase tracking-wider">Check your email</p>
            <p className="text-gray-400 text-sm font-body">
              We sent a password reset link to <span className="text-foreground">{email}</span>
            </p>
          </div>
          <button onClick={() => setResetSent(false)} className="text-xs text-neon-cyan hover:underline">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="font-display font-black text-3xl tracking-wider text-foreground hover:text-neon-cyan transition-colors">
            SWZZLE
          </Link>
          <p className="text-gray-400 text-sm mt-3 font-body">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-neon-red/10 border border-neon-red/20 rounded-lg p-3 text-sm text-neon-red text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs text-gray-500 mb-1.5 font-body">Email</label>
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
          <div>
            <label htmlFor="password" className="block text-xs text-gray-500 mb-1.5 font-body">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              minLength={6}
              className="w-full bg-background border border-border rounded px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors placeholder:text-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full border-2 border-neon-cyan text-neon-cyan font-display font-bold uppercase tracking-wider px-4 py-2.5 rounded hover:bg-neon-cyan/10 transition-all duration-300 disabled:opacity-50 text-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs">
          <button onClick={handleForgotPassword} className="text-gray-500 hover:text-neon-cyan transition-colors font-body">
            Forgot password?
          </button>
          <Link href="/auth/signup" className="text-neon-cyan hover:underline font-body">
            Create account
          </Link>
        </div>

        <p className="text-center text-xs text-gray-600">
          <Link href="/" className="text-neon-cyan hover:underline">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
