'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type LineItem = {
  description: string;
  quantity: number;
  amount_total: number;
};

type Order = {
  id: string;
  created: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  customer_details?: {
    email?: string;
    name?: string;
  };
  line_items?: {
    data: LineItem[];
  };
  metadata?: Record<string, string>;
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');

  const checkAuth = useCallback(async () => {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) {
      router.push('/hq/login');
      return;
    }
    setAuthed(true);
  }, [router]);

  const loadOrders = useCallback(async (startingAfter?: string) => {
    const isLoadMore = !!startingAfter;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const url = startingAfter
        ? `/api/orders?starting_after=${startingAfter}`
        : '/api/orders';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();

      if (isLoadMore) {
        setOrders((prev) => [...prev, ...data.sessions]);
      } else {
        setOrders(data.sessions);
      }
      setHasMore(data.has_more);
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authed) loadOrders();
  }, [authed, loadOrders]);

  function handleLoadMore() {
    if (orders.length > 0) {
      loadOrders(orders[orders.length - 1].id);
    }
  }

  function exportCSV() {
    const headers = ['Date', 'Order ID', 'Customer', 'Amount', 'Items', 'Status'];
    const rows = orders.map((order) => [
      new Date(order.created * 1000).toLocaleDateString(),
      order.id,
      order.customer_details?.email || 'N/A',
      `$${(order.amount_total / 100).toFixed(2)}`,
      order.line_items?.data.map((li) => `${li.description} x${li.quantity}`).join('; ') || 'N/A',
      order.payment_status,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swzzle-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/50 font-body">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/hq/dashboard"
              className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors"
            >
              &larr; Dashboard
            </Link>
            <h1 className="font-display text-2xl text-neon-cyan tracking-wider mt-2">
              ORDERS
            </h1>
          </div>
          <button
            type="button"
            onClick={exportCSV}
            disabled={orders.length === 0}
            className="px-6 py-2.5 bg-neon-purple/10 border border-neon-purple text-neon-purple font-display text-sm tracking-widest uppercase rounded-md hover:bg-neon-purple/20 transition-all disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>

        {error && (
          <div className="bg-neon-red/10 border border-neon-red/30 rounded-lg p-4 mb-6">
            <p className="text-neon-red text-sm font-body">{error}</p>
          </div>
        )}

        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-foreground/40 font-body">No orders found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                        DATE
                      </th>
                      <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                        ORDER ID
                      </th>
                      <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                        CUSTOMER
                      </th>
                      <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                        AMOUNT
                      </th>
                      <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                        ITEMS
                      </th>
                      <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border/50 hover:bg-surface-light/30 transition-colors"
                      >
                        <td className="p-4 font-body text-foreground/70 text-sm whitespace-nowrap">
                          {new Date(order.created * 1000).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-mono text-foreground/50 text-xs">
                          {order.id.slice(0, 20)}...
                        </td>
                        <td className="p-4 font-body text-foreground/70 text-sm">
                          {order.customer_details?.email || 'N/A'}
                        </td>
                        <td className="p-4 font-body text-foreground text-sm">
                          ${(order.amount_total / 100).toFixed(2)}{' '}
                          <span className="text-foreground/30 uppercase">
                            {order.currency}
                          </span>
                        </td>
                        <td className="p-4 font-body text-foreground/50 text-sm max-w-xs truncate">
                          {order.line_items?.data
                            .map((li) => `${li.description} x${li.quantity}`)
                            .join(', ') || 'N/A'}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-display tracking-wider ${
                              order.payment_status === 'paid'
                                ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
                                : 'bg-foreground/5 text-foreground/40 border border-foreground/10'
                            }`}
                          >
                            {order.payment_status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasMore && (
                <div className="p-4 text-center border-t border-border">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="text-sm text-neon-cyan/70 hover:text-neon-cyan font-display tracking-wider transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
