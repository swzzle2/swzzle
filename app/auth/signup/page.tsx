'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg p-6 space-y-3">
            <svg className="w-10 h-10 text-neon-cyan mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-foreground font-display text-sm uppercase tracking-wider">Confirm your email</p>
            <p className="text-gray-400 text-sm font-body">
              We sent a confirmation link to <span className="text-foreground">{email}</span>
            </p>
            <p className="text-gray-600 text-xs font-body">
              Click the link in the email to activate your account, then sign in.
            </p>
          </div>
          <Link href="/auth/signin" className="text-xs text-neon-cyan hover:underline">
            Go to sign in
          </Link>
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
          <p className="text-gray-400 text-sm mt-3 font-body">Create your account</p>
        </div>

        {error && (
          <div className="bg-neon-red/10 border border-neon-red/20 rounded-lg p-3 text-sm text-neon-red text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs text-gray-500 mb-1.5 font-body">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full bg-background border border-border rounded px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors placeholder:text-gray-600"
            />
          </div>
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
              placeholder="At least 6 characters"
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 font-body">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-neon-cyan hover:underline">Sign in</Link>
        </p>

        <p className="text-center text-xs text-gray-600">
          <Link href="/" className="text-neon-cyan hover:underline">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
