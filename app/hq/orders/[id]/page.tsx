'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Order } from '@/lib/orders';

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  shipped: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/30',
  cancelled: 'bg-neon-red/10 text-neon-red border-neon-red/30',
};

const CARRIERS = ['USPS', 'UPS', 'FedEx', 'DHL', 'Other'];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable fields
  const [status, setStatus] = useState<Order['status']>('paid');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [notes, setNotes] = useState('');

  const checkAuth = useCallback(async () => {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) {
      router.push('/hq/login');
      return;
    }
    setAuthed(true);
  }, [router]);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch order');
      const data = await res.json();
      const o = data.order as Order;
      setOrder(o);
      setStatus(o.status);
      setTrackingNumber(o.trackingNumber || '');
      setTrackingCarrier(o.trackingCarrier || '');
      setNotes(o.notes || '');
    } catch {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authed) loadOrder();
  }, [authed, loadOrder]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          status,
          trackingNumber: trackingNumber || undefined,
          trackingCarrier: trackingCarrier || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update order');
      }
      const data = await res.json();
      setOrder(data.order);
      setSuccess('Order updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendNotification() {
    if (!confirm('Send shipping update email to the customer?')) return;

    setSending(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notify`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send notification');
      }
      setSuccess('Shipping notification sent to customer');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  }

  const canSendNotification =
    (status === 'shipped' || status === 'delivered') && trackingNumber.trim().length > 0;

  if (!authed || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/50 font-body">
          {!authed ? 'Authenticating...' : 'Loading order...'}
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/hq/orders"
            className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors"
          >
            &larr; Back to Orders
          </Link>
          <div className="mt-8 bg-neon-red/10 border border-neon-red/30 rounded-lg p-6">
            <p className="text-neon-red font-body">Order not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/hq/orders"
            className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors"
          >
            &larr; Back to Orders
          </Link>
          <div className="flex items-center gap-4 mt-2">
            <h1 className="font-display text-2xl text-neon-cyan tracking-wider">
              ORDER DETAIL
            </h1>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-display tracking-wider border ${
                STATUS_STYLES[order.status] || ''
              }`}
            >
              {order.status.toUpperCase()}
            </span>
          </div>
          <p className="text-foreground/40 text-sm font-mono mt-1">{order.id}</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-neon-red/10 border border-neon-red/30 rounded-lg p-4 mb-6">
            <p className="text-neon-red text-sm font-body">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
            <p className="text-green-400 text-sm font-body">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="font-display text-sm tracking-wider text-foreground/50 mb-4">
              CUSTOMER INFO
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-foreground/40 text-xs font-body">Name</span>
                <p className="text-foreground font-body">{order.customerName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-foreground/40 text-xs font-body">Email</span>
                <p className="text-foreground font-body">{order.customerEmail || 'N/A'}</p>
              </div>
              {order.customerId && (
                <div>
                  <span className="text-foreground/40 text-xs font-body">Customer ID</span>
                  <p className="text-foreground/70 font-mono text-sm">{order.customerId}</p>
                </div>
              )}
              {order.couponCode && (
                <div>
                  <span className="text-foreground/40 text-xs font-body">Coupon Used</span>
                  <p className="text-neon-purple font-display text-sm tracking-wider">
                    {order.couponCode}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="font-display text-sm tracking-wider text-foreground/50 mb-4">
              ORDER SUMMARY
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-foreground/40 text-xs font-body">Stripe Session</span>
                <p className="text-foreground/70 font-mono text-xs break-all">
                  {order.stripeSessionId}
                </p>
              </div>
              <div>
                <span className="text-foreground/40 text-xs font-body">Total</span>
                <p className="text-foreground font-display text-2xl">
                  ${(order.amountTotal / 100).toFixed(2)}{' '}
                  <span className="text-foreground/30 text-sm uppercase">{order.currency}</span>
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <span className="text-foreground/40 text-xs font-body">Created</span>
                  <p className="text-foreground/70 font-body text-sm">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-foreground/40 text-xs font-body">Updated</span>
                  <p className="text-foreground/70 font-body text-sm">
                    {new Date(order.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden mt-6">
          <div className="p-6 border-b border-border">
            <h2 className="font-display text-sm tracking-wider text-foreground/50">
              LINE ITEMS
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                    PRODUCT
                  </th>
                  <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                    PRODUCT ID
                  </th>
                  <th className="text-right p-4 font-display text-xs tracking-wider text-foreground/50">
                    QTY
                  </th>
                  <th className="text-right p-4 font-display text-xs tracking-wider text-foreground/50">
                    UNIT PRICE
                  </th>
                  <th className="text-right p-4 font-display text-xs tracking-wider text-foreground/50">
                    SUBTOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="p-4 font-body text-foreground text-sm">{item.name}</td>
                    <td className="p-4 font-mono text-foreground/40 text-xs">{item.productId}</td>
                    <td className="p-4 font-body text-foreground/70 text-sm text-right">
                      {item.quantity}
                    </td>
                    <td className="p-4 font-body text-foreground/70 text-sm text-right">
                      ${(item.unitAmount / 100).toFixed(2)}
                    </td>
                    <td className="p-4 font-body text-foreground text-sm text-right">
                      ${((item.unitAmount * item.quantity) / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Management Section */}
        <div className="bg-surface border border-border rounded-lg p-6 mt-6">
          <h2 className="font-display text-sm tracking-wider text-foreground/50 mb-6">
            ORDER MANAGEMENT
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div>
              <label className="block text-foreground/40 text-xs font-body mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Order['status'])}
                className="neon-input w-full"
              >
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Tracking Carrier */}
            <div>
              <label className="block text-foreground/40 text-xs font-body mb-2">
                Tracking Carrier
              </label>
              <select
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
                className="neon-input w-full"
              >
                <option value="">Select carrier...</option>
                {CARRIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Tracking Number */}
            <div className="md:col-span-2">
              <label className="block text-foreground/40 text-xs font-body mb-2">
                Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number..."
                className="neon-input w-full"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-foreground/40 text-xs font-body mb-2">
                Admin Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about this order..."
                rows={3}
                className="neon-input w-full resize-y"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-border">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-display text-sm tracking-widest uppercase rounded-md hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
            >
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
            <button
              type="button"
              onClick={handleSendNotification}
              disabled={!canSendNotification || sending}
              title={
                !canSendNotification
                  ? 'Set status to shipped/delivered and add tracking number first'
                  : 'Send shipping update email to customer'
              }
              className="px-6 py-2.5 bg-neon-purple/10 border border-neon-purple text-neon-purple font-display text-sm tracking-widest uppercase rounded-md hover:bg-neon-purple/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {sending ? 'SENDING...' : 'SEND SHIPPING UPDATE EMAIL'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
