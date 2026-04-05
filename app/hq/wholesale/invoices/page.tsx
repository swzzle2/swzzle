'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { WholesaleInvoice } from '@/lib/invoices';

const STATUS_BADGES: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  open: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
  paid: 'bg-green-400/10 text-green-400 border-green-400/30',
  void: 'bg-neon-red/10 text-neon-red border-neon-red/30',
};

const TABS = ['all', 'draft', 'open', 'paid', 'void'] as const;

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<WholesaleInvoice[]>([]);
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
    fetchInvoices();
  }, [checkAuth]);

  async function fetchInvoices() {
    try {
      const res = await fetch('/api/admin/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === 'all' ? invoices : invoices.filter((inv) => inv.status === filter);

  function formatCurrency(cents: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
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
            <Link
              href="/hq/wholesale"
              className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors"
            >
              &larr; Wholesale
            </Link>
            <h1 className="font-display text-2xl text-neon-cyan tracking-wider mt-2">
              INVOICES
            </h1>
            <p className="text-foreground/40 text-sm font-body mt-1">
              {invoices.length} total &middot; {invoices.filter((i) => i.status === 'draft').length} draft &middot; {invoices.filter((i) => i.status === 'open').length} open
            </p>
          </div>
          <Link
            href="/hq/wholesale/invoices/new"
            className="bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-display text-xs uppercase tracking-wider px-4 py-2 rounded hover:bg-neon-cyan/20 transition-colors"
          >
            Create Invoice
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => {
            const count = tab === 'all' ? invoices.length : invoices.filter((i) => i.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`font-display text-xs uppercase tracking-wider px-3 py-1.5 rounded border transition-colors ${
                  filter === tab
                    ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30'
                    : 'text-gray-500 border-border hover:text-foreground'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-12 text-center">
            <p className="text-foreground/40 font-body">No invoices found.</p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">DATE</th>
                    <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">COMPANY</th>
                    <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">CUSTOMER</th>
                    <th className="text-right p-4 font-display text-xs tracking-wider text-foreground/50">AMOUNT</th>
                    <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">STATUS</th>
                    <th className="text-right p-4 font-display text-xs tracking-wider text-foreground/50">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((inv) => (
                      <tr
                        key={inv.id}
                        className="border-b border-border/50 hover:bg-surface-light/30 transition-colors"
                      >
                        <td className="p-4 font-body text-foreground/70 text-sm whitespace-nowrap">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-body text-foreground text-sm">{inv.companyName}</td>
                        <td className="p-4 font-body text-foreground/70 text-sm">{inv.customerName}</td>
                        <td className="p-4 font-body text-foreground text-sm text-right font-mono">
                          {formatCurrency(inv.total)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-display tracking-wider border ${
                              STATUS_BADGES[inv.status] || ''
                            }`}
                          >
                            {inv.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/hq/wholesale/invoices/${inv.id}`}
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
