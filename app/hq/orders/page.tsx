'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Order } from '@/lib/orders';

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  shipped: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/30',
  cancelled: 'bg-neon-red/10 text-neon-red border-neon-red/30',
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const checkAuth = useCallback(async () => {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) {
      router.push('/hq/login');
      return;
    }
    setAuthed(true);
  }, [router]);

  const loadOrders = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders?page=${p}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authed) loadOrders(page);
  }, [authed]); // eslint-disable-line react-hooks/exhaustive-deps

  function goToPage(p: number) {
    setPage(p);
    loadOrders(p);
  }

  function exportCSV() {
    const headers = ['Date', 'Order ID', 'Customer', 'Email', 'Amount', 'Items', 'Status', 'Tracking'];
    const rows = orders.map((order) => [
      new Date(order.createdAt).toLocaleDateString(),
      order.id,
      order.customerName,
      order.customerEmail,
      `$${(order.amountTotal / 100).toFixed(2)}`,
      order.items.map((i) => `${i.name} x${i.quantity}`).join('; '),
      order.status,
      order.trackingNumber || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swzzle-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/50 font-body">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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
            <p className="text-foreground/40 text-sm font-body mt-1">
              {total} total order{total !== 1 ? 's' : ''}
            </p>
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

        {/* Error */}
        {error && (
          <div className="bg-neon-red/10 border border-neon-red/30 rounded-lg p-4 mb-6">
            <p className="text-neon-red text-sm font-body">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-foreground/40 font-body">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-foreground/40 font-body">No orders found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {['DATE', 'ORDER ID', 'CUSTOMER', 'EMAIL', 'AMOUNT', 'ITEMS', 'STATUS', 'ACTIONS'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left p-4 font-display text-xs tracking-wider text-foreground/50"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border/50 hover:bg-surface-light/30 transition-colors"
                      >
                        <td className="p-4 font-body text-foreground/70 text-sm whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/hq/orders/${order.id}`}
                            className="font-mono text-neon-cyan/70 hover:text-neon-cyan text-xs transition-colors"
                          >
                            {order.id.length > 16 ? `${order.id.slice(0, 16)}...` : order.id}
                          </Link>
                        </td>
                        <td className="p-4 font-body text-foreground/70 text-sm">
                          {order.customerName || 'N/A'}
                        </td>
                        <td className="p-4 font-body text-foreground/50 text-sm">
                          {order.customerEmail || 'N/A'}
                        </td>
                        <td className="p-4 font-body text-foreground text-sm whitespace-nowrap">
                          ${(order.amountTotal / 100).toFixed(2)}{' '}
                          <span className="text-foreground/30 uppercase text-xs">
                            {order.currency}
                          </span>
                        </td>
                        <td className="p-4 font-body text-foreground/50 text-sm">
                          {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-display tracking-wider border ${
                              STATUS_STYLES[order.status] || 'bg-foreground/5 text-foreground/40 border-foreground/10'
                            }`}
                          >
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/hq/orders/${order.id}`}
                            className="text-xs font-display tracking-wider text-neon-cyan/60 hover:text-neon-cyan transition-colors"
                          >
                            VIEW
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <p className="text-foreground/40 text-sm font-body">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1}
                      className="px-4 py-2 text-sm font-display tracking-wider text-foreground/50 hover:text-neon-cyan border border-border rounded-md hover:border-neon-cyan/30 transition-all disabled:opacity-30 disabled:hover:text-foreground/50 disabled:hover:border-border"
                    >
                      PREV
                    </button>
                    <button
                      type="button"
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages}
                      className="px-4 py-2 text-sm font-display tracking-wider text-foreground/50 hover:text-neon-cyan border border-border rounded-md hover:border-neon-cyan/30 transition-all disabled:opacity-30 disabled:hover:text-foreground/50 disabled:hover:border-border"
                    >
                      NEXT
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
