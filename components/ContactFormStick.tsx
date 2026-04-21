'use client';

import { useState } from 'react';

export function ContactFormStick() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          subject: 'TD Wholesale Inquiry',
        }),
      });

      if (!res.ok) throw new Error('Failed to send');
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="border border-neon-cyan/30 rounded-lg p-8 bg-surface text-center">
        <div className="flex items-center justify-center gap-2 text-neon-cyan mb-2">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span className="font-display text-lg uppercase tracking-wider">Message Sent</span>
        </div>
        <p className="text-gray-400 text-sm">We will get back to you within 24 hours.</p>
      </div>
    );
  }

  const inputClass = "w-full bg-surface border border-border rounded px-4 py-3 text-sm text-foreground placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:shadow-[0_0_10px_rgba(0,229,255,0.15)] transition-all";

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-lg p-6 md:p-8 bg-surface/50 space-y-4 text-left max-w-lg mx-auto">
      <div>
        <label className="block text-xs font-display uppercase tracking-wider text-gray-500 mb-1.5">Name *</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Your name"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs font-display uppercase tracking-wider text-gray-500 mb-1.5">Email *</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs font-display uppercase tracking-wider text-gray-500 mb-1.5">Phone (optional)</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="(555) 555-5555"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs font-display uppercase tracking-wider text-gray-500 mb-1.5">Message *</label>
        <textarea
          required
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Tell us about your tournament, expected player count, timeline..."
          className={inputClass + ' resize-none'}
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full border-2 border-neon-cyan text-neon-cyan font-display font-bold uppercase tracking-wider px-6 py-3 rounded hover:bg-neon-cyan/10 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? 'Sending...' : 'Send Inquiry'}
      </button>
      {status === 'error' && (
        <p className="text-neon-red text-xs text-center">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
