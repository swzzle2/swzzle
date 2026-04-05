'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Supabase sets session from the URL hash on this page
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Also check if already in recovery state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
  }, [supabase.auth]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/account'), 2000);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-neon-cyan text-4xl">&#10003;</div>
          <p className="font-display text-sm uppercase tracking-wider text-neon-cyan">Password updated</p>
          <p className="text-gray-400 text-sm font-body">Redirecting to your account...</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 font-display text-sm tracking-wider">Loading...</p>
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
          <p className="text-gray-400 text-sm mt-3 font-body">Set your new password</p>
        </div>

        {error && (
          <div className="bg-neon-red/10 border border-neon-red/20 rounded-lg p-3 text-sm text-neon-red text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs text-gray-500 mb-1.5 font-body">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full bg-background border border-border rounded px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors placeholder:text-gray-600"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-xs text-gray-500 mb-1.5 font-body">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
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
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
