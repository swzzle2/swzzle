'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Order } from '@/lib/orders';

const CARRIER_URLS: Record<string, (tn: string) => string> = {
  ups: (tn) => `https://www.ups.com/track?tracknum=${tn}`,
  usps: (tn) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tn}`,
  fedex: (tn) => `https://www.fedex.com/fedextrack/?trknbr=${tn}`,
  dhl: (tn) => `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${tn}`,
};

const STATUS_STEPS = ['paid', 'shipped', 'delivered'] as const;

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/customer/orders?id=${orderId}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data.order);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link href="/account/orders" className="text-sm text-neon-cyan hover:underline">
          &larr; Back to orders
        </Link>
        <div className="bg-neon-red/10 border border-neon-red/20 rounded-lg p-6 text-center">
          <p className="text-neon-red text-sm">{error || 'Order not found'}</p>
        </div>
      </div>
    );
  }

  const carrierKey = order.trackingCarrier?.toLowerCase() ?? '';
  const trackingUrl =
    order.trackingNumber && CARRIER_URLS[carrierKey]
      ? CARRIER_URLS[carrierKey](order.trackingNumber)
      : null;

  const currentStepIndex = order.status === 'cancelled' ? -1 : STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);

  return (
    <div className="space-y-8">
      <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm text-neon-cyan hover:underline">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to orders
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold tracking-wide">
            Order <span className="text-gray-400 font-mono">#{order.id.slice(0, 8)}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Status timeline */}
      {order.status !== 'cancelled' && (
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      i <= currentStepIndex
                        ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                        : 'border-gray-700 text-gray-700'
                    }`}
                  >
                    {i <= currentStepIndex ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <span className="text-xs font-display">{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-display uppercase tracking-wider mt-2 ${
                      i <= currentStepIndex ? 'text-neon-cyan' : 'text-gray-600'
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 mt-[-1.25rem] ${
                      i < currentStepIndex ? 'bg-neon-cyan' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {order.status === 'cancelled' && (
        <div className="bg-neon-red/5 border border-neon-red/20 rounded-lg p-4 text-center">
          <p className="text-neon-red text-sm">This order has been cancelled.</p>
        </div>
      )}

      {/* Tracking */}
      {order.trackingNumber && (
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="font-display text-sm uppercase tracking-wider text-gray-400 mb-3">
            Tracking Information
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {order.trackingCarrier && (
              <span className="text-sm text-gray-300 uppercase font-display">
                {order.trackingCarrier}
              </span>
            )}
            <span className="text-sm font-mono text-foreground">{order.trackingNumber}</span>
            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-neon-cyan hover:underline"
              >
                Track package
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-display text-sm uppercase tracking-wider text-gray-400">
            Items
          </h3>
        </div>
        <div className="divide-y divide-border">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-body">{item.name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm font-display">
                ${((item.unitAmount * item.quantity) / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-border bg-background/50 flex items-center justify-between">
          <span className="font-display text-sm uppercase tracking-wider text-gray-400">Total</span>
          <span className="font-display text-lg text-foreground">
            ${(order.amountTotal / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {order.notes && (
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="font-display text-sm uppercase tracking-wider text-gray-400 mb-2">Notes</h3>
          <p className="text-sm text-gray-300">{order.notes}</p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    shipped: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20',
    delivered: 'text-green-400 bg-green-400/10 border-green-400/20',
    cancelled: 'text-neon-red bg-neon-red/10 border-neon-red/20',
  };
  return (
    <span
      className={`text-xs font-display uppercase tracking-wider px-3 py-1 rounded border ${
        styles[status] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/20'
      }`}
    >
      {status}
    </span>
  );
}
