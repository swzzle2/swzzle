'use client';

import { useState } from 'react';

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to subscribe');
      }

      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-neon-cyan">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <span className="font-display text-sm uppercase tracking-wider">
          You&apos;re in!
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="Enter your email"
          required
          className="flex-1 bg-surface border border-border rounded px-4 py-2.5 text-sm text-foreground placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan/50 transition-colors min-w-0"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="border border-neon-cyan text-neon-cyan font-display text-xs uppercase tracking-wider px-5 py-2.5 rounded hover:bg-neon-cyan/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {status === 'loading' ? 'Joining...' : 'Join'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-neon-red text-xs">{errorMsg}</p>
      )}
    </form>
  );
}
