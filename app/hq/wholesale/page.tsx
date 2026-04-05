'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-neon-red/10 text-neon-red border-neon-red/30',
  contacted: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
  negotiating: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  'closed-won': 'bg-green-400/10 text-green-400 border-green-400/30',
  'closed-lost': 'bg-gray-500/10 text-gray-500 border-gray-500/30',
};

export default function WholesalePage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) router.push('/hq/login');
  }, [router]);

  useEffect(() => {
    checkAuth();
    fetchInquiries();
  }, [checkAuth]);

  async function fetchInquiries() {
    try {
      const res = await fetch('/api/admin/inquiries?source=wholesale');
      const data = await res.json();
      setInquiries(data.inquiries || []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === 'all' ? inquiries : inquiries.filter((i) => i.status === filter);

  function exportCSV() {
    const headers = ['Date', 'Name', 'Email', 'Status', 'Message', 'Notes'];
    const rows = filtered.map((i) => [
      new Date(i.date).toLocaleDateString(),
      i.name,
      i.email,
      i.status,
      `"${i.message.replace(/"/g, '""')}"`,
      `"${i.notes.join(' | ').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wholesale-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/hq/dashboard" className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors">
              &larr; Dashboard
            </Link>
            <h1 className="font-display text-2xl text-neon-cyan tracking-wider mt-2">
              WHOLESALE INQUIRIES
            </h1>
            <p className="text-foreground/40 text-sm font-body mt-1">
              {inquiries.length} total &middot; {inquiries.filter((i) => i.status === 'new').length} new
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/hq/wholesale/invoices"
              className="bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-display text-xs uppercase tracking-wider px-4 py-2 rounded hover:bg-neon-cyan/20 transition-colors"
            >
              Invoices
            </Link>
            <button
              onClick={exportCSV}
              className="border border-neon-cyan/30 text-neon-cyan font-display text-xs uppercase tracking-wider px-4 py-2 rounded hover:bg-neon-cyan/10 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'new', 'contacted', 'negotiating', 'closed-won', 'closed-lost'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`font-display text-xs uppercase tracking-wider px-3 py-1.5 rounded border transition-colors ${
                filter === s
                  ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30'
                  : 'text-gray-500 border-border hover:text-foreground'
              }`}
            >
              {s === 'all' ? `All (${inquiries.length})` : `${s.replace('-', ' ')} (${inquiries.filter((i) => i.status === s).length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-12 text-center">
            <p className="text-foreground/40 font-body">No inquiries found.</p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">DATE</th>
                    <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">NAME</th>
                    <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">EMAIL</th>
                    <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">STATUS</th>
                    <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">NOTES</th>
                    <th className="text-right p-4 font-display text-xs tracking-wider text-foreground/50">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inq) => (
                    <tr key={inq.id} className="border-b border-border/50 hover:bg-surface-light/30 transition-colors">
                      <td className="p-4 font-body text-foreground/70 text-sm whitespace-nowrap">
                        {new Date(inq.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-body text-foreground text-sm">{inq.name}</td>
                      <td className="p-4 font-body text-foreground/70 text-sm">{inq.email}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-display tracking-wider border ${STATUS_COLORS[inq.status] || ''}`}>
                          {inq.status.toUpperCase().replace('-', ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-body text-foreground/50 text-xs">
                        {inq.notes.length > 0 ? `${inq.notes.length} note${inq.notes.length > 1 ? 's' : ''}` : '—'}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/hq/wholesale/${inq.id}`}
                          className="text-sm text-neon-cyan/70 hover:text-neon-cyan font-body transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
