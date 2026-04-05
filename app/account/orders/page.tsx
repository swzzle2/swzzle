'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Order } from '@/lib/orders';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/customer/orders');
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        setOrders(data.orders);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neon-red/10 border border-neon-red/20 rounded-lg p-6 text-center">
        <p className="text-neon-red text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide">Order History</h1>

      {orders.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <p className="text-gray-500 mb-4">No orders yet</p>
          <Link
            href="/products/red"
            className="inline-block border border-neon-cyan text-neon-cyan font-display text-sm uppercase tracking-wider px-6 py-2.5 rounded hover:bg-neon-cyan/10 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block bg-surface border border-border rounded-lg p-5 hover:border-neon-cyan/20 transition-all duration-200 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-body">
                        Order <span className="text-gray-400 font-mono">#{order.id.slice(0, 8)}</span>
                      </p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xs text-gray-500">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                    <span className="font-display text-sm">
                      ${(order.amountTotal / 100).toFixed(2)}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-600 group-hover:text-neon-cyan transition-colors"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
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
      className={`text-xs font-display uppercase tracking-wider px-2 py-0.5 rounded border ${
        styles[status] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/20'
      }`}
    >
      {status}
    </span>
  );
}
