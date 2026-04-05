'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { WholesaleInvoice } from '@/lib/invoices';

const STATUS_BADGES: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  open: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
  paid: 'bg-green-400/10 text-green-400 border-green-400/30',
  void: 'bg-neon-red/10 text-neon-red border-neon-red/30',
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<WholesaleInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const checkAuth = useCallback(async () => {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) router.push('/hq/login');
  }, [router]);

  useEffect(() => {
    checkAuth();
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkAuth, id]);

  async function fetchInvoice(retries = 3) {
    try {
      const res = await fetch(`/api/admin/invoices?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
        setLoading(false);
      } else if (retries > 0) {
        // Blob may not have propagated yet — retry
        await new Promise((r) => setTimeout(r, 1000));
        return fetchInvoice(retries - 1);
      } else {
        setError('Invoice not found');
        setLoading(false);
      }
    } catch {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 1000));
        return fetchInvoice(retries - 1);
      }
      setError('Failed to load invoice');
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!invoice) return;
    setActionLoading('send');
    setError('');
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}/send`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send invoice');
      }
      const updated = await res.json();
      setInvoice(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setActionLoading('');
    }
  }

  async function handleVoid() {
    if (!invoice) return;
    if (!confirm('Are you sure you want to void this invoice? This cannot be undone.')) return;
    setActionLoading('void');
    setError('');
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}/void`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to void invoice');
      }
      const updated = await res.json();
      setInvoice(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to void');
    } finally {
      setActionLoading('');
    }
  }

  function copyPaymentLink() {
    if (invoice?.hostedUrl) {
      navigator.clipboard.writeText(invoice.hostedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

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

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <Link href="/hq/wholesale/invoices" className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors">
            &larr; Invoices
          </Link>
          <div className="bg-surface border border-border rounded-lg p-12 text-center mt-6">
            <p className="text-neon-red font-body">{error || 'Invoice not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/hq/wholesale/invoices"
              className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors"
            >
              &larr; Invoices
            </Link>
            <div className="flex items-center gap-3 mt-2">
              <h1 className="font-display text-2xl text-neon-cyan tracking-wider">
                INVOICE
              </h1>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-display tracking-wider border ${
                  STATUS_BADGES[invoice.status] || ''
                }`}
              >
                {invoice.status.toUpperCase()}
              </span>
            </div>
            <p className="text-foreground/40 text-xs font-mono mt-1">{invoice.id}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {invoice.status === 'draft' && (
              <>
                <button
                  onClick={handleSend}
                  disabled={!!actionLoading}
                  className="bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-display text-xs uppercase tracking-wider px-4 py-2 rounded hover:bg-neon-cyan/20 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'send' ? 'Sending...' : 'Send Invoice'}
                </button>
                <button
                  onClick={handleVoid}
                  disabled={!!actionLoading}
                  className="border border-neon-red/30 text-neon-red font-display text-xs uppercase tracking-wider px-4 py-2 rounded hover:bg-neon-red/10 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'void' ? 'Voiding...' : 'Void'}
                </button>
              </>
            )}
            {invoice.status === 'open' && (
              <>
                <button
                  onClick={copyPaymentLink}
                  className="bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-display text-xs uppercase tracking-wider px-4 py-2 rounded hover:bg-neon-cyan/20 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy Payment Link'}
                </button>
                <button
                  onClick={handleVoid}
                  disabled={!!actionLoading}
                  className="border border-neon-red/30 text-neon-red font-display text-xs uppercase tracking-wider px-4 py-2 rounded hover:bg-neon-red/10 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'void' ? 'Voiding...' : 'Void'}
                </button>
              </>
            )}
            {invoice.status === 'paid' && invoice.orderId && (
              <Link
                href={`/hq/orders/${invoice.orderId}`}
                className="bg-green-400/10 border border-green-400/30 text-green-400 font-display text-xs uppercase tracking-wider px-4 py-2 rounded hover:bg-green-400/20 transition-colors"
              >
                View Order
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-neon-red/10 border border-neon-red/30 rounded-lg p-4 mb-6">
            <p className="text-neon-red font-body text-sm">{error}</p>
          </div>
        )}

        {/* Customer Info */}
        <div className="bg-surface border border-border rounded-lg p-6 mb-6">
          <h2 className="font-display text-sm uppercase tracking-wider text-foreground/60 mb-4">
            Customer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-display tracking-wider text-foreground/40 mb-1">NAME</p>
              <p className="font-body text-foreground">{invoice.customerName}</p>
            </div>
            <div>
              <p className="text-xs font-display tracking-wider text-foreground/40 mb-1">EMAIL</p>
              <p className="font-body text-foreground/80">{invoice.customerEmail}</p>
            </div>
            <div>
              <p className="text-xs font-display tracking-wider text-foreground/40 mb-1">COMPANY</p>
              <p className="font-body text-foreground">{invoice.companyName}</p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden mb-6">
          <div className="p-6 pb-0">
            <h2 className="font-display text-sm uppercase tracking-wider text-foreground/60 mb-4">
              Line Items
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">ITEM</th>
                  <th className="text-center p-4 font-display text-xs tracking-wider text-foreground/50">QTY</th>
                  <th className="text-right p-4 font-display text-xs tracking-wider text-foreground/50">UNIT PRICE</th>
                  <th className="text-right p-4 font-display text-xs tracking-wider text-foreground/50">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-4 font-body text-foreground text-sm">{item.name}</td>
                    <td className="p-4 font-body text-foreground/70 text-sm text-center">{item.quantity}</td>
                    <td className="p-4 font-body text-foreground/70 text-sm text-right font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="p-4 font-body text-foreground text-sm text-right font-mono">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
                {invoice.shippingCost > 0 && (
                  <tr className="border-b border-border/50">
                    <td className="p-4 font-body text-foreground/60 text-sm" colSpan={3}>
                      Shipping
                    </td>
                    <td className="p-4 font-body text-foreground text-sm text-right font-mono">
                      {formatCurrency(invoice.shippingCost)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-neon-cyan/30">
                  <td className="p-4 font-display text-xs tracking-wider text-foreground/50" colSpan={3}>
                    SUBTOTAL
                  </td>
                  <td className="p-4 font-body text-foreground text-sm text-right font-mono">
                    {formatCurrency(invoice.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 pb-4 font-display text-sm tracking-wider text-neon-cyan" colSpan={3}>
                    TOTAL
                  </td>
                  <td className="px-4 pb-4 font-body text-neon-cyan text-base text-right font-mono font-bold">
                    {formatCurrency(invoice.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Details */}
        <div className="bg-surface border border-border rounded-lg p-6 mb-6">
          <h2 className="font-display text-sm uppercase tracking-wider text-foreground/60 mb-4">
            Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-display tracking-wider text-foreground/40 mb-1">DAYS UNTIL DUE</p>
              <p className="font-body text-foreground">{invoice.daysUntilDue} days</p>
            </div>
            <div>
              <p className="text-xs font-display tracking-wider text-foreground/40 mb-1">CURRENCY</p>
              <p className="font-body text-foreground">{invoice.currency.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs font-display tracking-wider text-foreground/40 mb-1">CREATED</p>
              <p className="font-body text-foreground/80 text-sm">
                {new Date(invoice.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-display tracking-wider text-foreground/40 mb-1">UPDATED</p>
              <p className="font-body text-foreground/80 text-sm">
                {new Date(invoice.updatedAt).toLocaleString()}
              </p>
            </div>
            {invoice.memo && (
              <div className="md:col-span-2">
                <p className="text-xs font-display tracking-wider text-foreground/40 mb-1">MEMO</p>
                <p className="font-body text-foreground/80 text-sm whitespace-pre-wrap">{invoice.memo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Links */}
        {(invoice.hostedUrl || invoice.pdfUrl) && (
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="font-display text-sm uppercase tracking-wider text-foreground/60 mb-4">
              Links
            </h2>
            <div className="space-y-3">
              {invoice.hostedUrl && (
                <div>
                  <p className="text-xs font-display tracking-wider text-foreground/40 mb-1">PAYMENT PAGE</p>
                  <a
                    href={invoice.hostedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-neon-cyan text-sm hover:underline break-all"
                  >
                    {invoice.hostedUrl}
                  </a>
                </div>
              )}
              {invoice.pdfUrl && (
                <div>
                  <p className="text-xs font-display tracking-wider text-foreground/40 mb-1">PDF DOWNLOAD</p>
                  <a
                    href={invoice.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-neon-purple text-sm hover:underline break-all"
                  >
                    Download PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stripe Reference */}
        <div className="mt-6 text-center">
          <p className="text-foreground/20 font-mono text-xs">
            Stripe: {invoice.stripeInvoiceId} | Customer: {invoice.stripeCustomerId}
          </p>
        </div>
      </div>
    </div>
  );
}
