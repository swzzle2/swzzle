'use client';

import { useState } from 'react';

export function ContactForm({ subject = '', buttonText = 'Send Inquiry' }: { subject?: string; buttonText?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-block border-2 border-neon-purple text-neon-purple font-display font-bold uppercase tracking-wider px-10 py-4 rounded hover:bg-neon-purple/10 transition-all duration-300"
      >
        {buttonText}
      </button>
    );
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto border border-neon-cyan/30 rounded-xl p-8 bg-surface text-center">
        <div className="text-neon-cyan text-4xl mb-4">&#10003;</div>
        <h3 className="font-display text-xl text-neon-cyan tracking-wider mb-2">
          THANK YOU
        </h3>
        <p className="text-gray-400 text-sm font-body">
          Your inquiry has been submitted. We&apos;ll be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <div>
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="neon-input"
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="neon-input"
        />
      </div>
      <div>
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="neon-input"
        />
      </div>
      <div>
        <div className="text-xs font-display text-foreground/40 tracking-wider mb-1">
          SUBJECT
        </div>
        <div className="neon-input bg-surface-light text-foreground/60">
          {subject}
        </div>
      </div>
      <div>
        <textarea
          placeholder="Your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          className="neon-input resize-y"
        />
      </div>

      {error && (
        <p className="text-neon-red text-sm font-body">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={sending}
          className="flex-1 border-2 border-neon-purple text-neon-purple font-display font-bold uppercase tracking-wider px-6 py-3 rounded hover:bg-neon-purple/10 transition-all duration-300 disabled:opacity-50 text-sm"
        >
          {sending ? 'Sending...' : 'Submit'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="border-2 border-border text-foreground/40 font-display uppercase tracking-wider px-6 py-3 rounded hover:bg-surface-light transition-all duration-300 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
