'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  date: string;
  status: 'new' | 'contacted' | 'negotiating' | 'closed-won' | 'closed-lost';
  notes: string[];
  source: string;
};

const STATUSES = ['new', 'contacted', 'negotiating', 'closed-won', 'closed-lost'] as const;

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-neon-red/10 text-neon-red border-neon-red/30',
  contacted: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
  negotiating: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  'closed-won': 'bg-green-400/10 text-green-400 border-green-400/30',
  'closed-lost': 'bg-gray-500/10 text-gray-500 border-gray-500/30',
};

export default function WholesaleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [message, setMessage] = useState('');

  const checkAuth = useCallback(async () => {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) router.push('/hq/login');
  }, [router]);

  const fetchInquiry = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/inquiries?id=${id}`);
      const data = await res.json();
      setInquiry(data.inquiry);
    } catch {
      setMessage('Failed to load inquiry');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    checkAuth();
    fetchInquiry();
  }, [checkAuth, fetchInquiry]);

  async function updateStatus(status: string) {
    if (!inquiry) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inquiry.id, status }),
      });
      const data = await res.json();
      if (res.ok) setInquiry(data.inquiry);
    } catch {
      setMessage('Failed to update status');
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!inquiry || !newNote.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inquiry.id, note: newNote }),
      });
      const data = await res.json();
      if (res.ok) {
        setInquiry(data.inquiry);
        setNewNote('');
      }
    } catch {
      setMessage('Failed to add note');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-neon-red font-body">Inquiry not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/hq/wholesale" className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors">
            &larr; Wholesale Inquiries
          </Link>
          <h1 className="font-display text-2xl text-neon-cyan tracking-wider mt-2">
            {inquiry.name}
          </h1>
          <p className="text-foreground/40 text-sm font-body mt-1">
            Submitted {new Date(inquiry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {message && (
          <div className="bg-neon-red/10 border border-neon-red/20 rounded-lg p-3 text-sm text-neon-red mb-6">
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="font-display text-sm uppercase tracking-wider text-foreground/50 mb-4">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-body">Name</p>
                <p className="text-foreground font-body">{inquiry.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-body">Email</p>
                <a href={`mailto:${inquiry.email}`} className="text-neon-cyan font-body hover:underline">{inquiry.email}</a>
              </div>
              {inquiry.phone && (
                <div>
                  <p className="text-xs text-gray-500 font-body">Phone</p>
                  <a href={`tel:${inquiry.phone}`} className="text-neon-cyan font-body hover:underline">{inquiry.phone}</a>
                </div>
              )}
            </div>
          </div>

          {/* Original Message */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="font-display text-sm uppercase tracking-wider text-foreground/50 mb-4">Original Message</h2>
            <p className="text-foreground/80 font-body leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
          </div>

          {/* Status Pipeline */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="font-display text-sm uppercase tracking-wider text-foreground/50 mb-4">Status</h2>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={saving}
                  className={`font-display text-xs uppercase tracking-wider px-4 py-2 rounded border transition-all ${
                    inquiry.status === s
                      ? STATUS_COLORS[s]
                      : 'text-gray-600 border-border hover:text-foreground hover:border-gray-500'
                  } disabled:opacity-50`}
                >
                  {s.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Notes / Activity Log */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="font-display text-sm uppercase tracking-wider text-foreground/50 mb-4">
              Follow-Up Notes ({inquiry.notes.length})
            </h2>

            {/* Add note */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
                placeholder="Add a note... (press Enter)"
                className="flex-1 bg-background border border-border rounded px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors placeholder:text-gray-600"
              />
              <button
                onClick={addNote}
                disabled={saving || !newNote.trim()}
                className="border border-neon-cyan text-neon-cyan font-display text-xs uppercase tracking-wider px-4 py-2.5 rounded hover:bg-neon-cyan/10 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {/* Notes list */}
            {inquiry.notes.length === 0 ? (
              <p className="text-gray-600 text-sm font-body">No notes yet. Add your first follow-up note above.</p>
            ) : (
              <div className="space-y-3">
                {[...inquiry.notes].reverse().map((note, i) => (
                  <div key={i} className="bg-background border border-border/50 rounded-lg px-4 py-3">
                    <p className="text-foreground/80 text-sm font-body">{note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(inquiry.subject)}`}
              className="border border-neon-cyan text-neon-cyan font-display text-xs uppercase tracking-wider px-6 py-2.5 rounded hover:bg-neon-cyan/10 transition-colors"
            >
              Send Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
