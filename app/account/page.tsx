'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { Order } from '@/lib/orders';
import type { User } from '@supabase/supabase-js';

export default function AccountOverviewPage() {
  const [user, setUser] = useState<User | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/customer/orders');
        if (res.ok) {
          const data = await res.json();
          setRecentOrders(data.orders.slice(0, 3));
        }
      } catch {
        // silently fail — orders section will just be empty
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '';
  const firstName = displayName.split(' ')[0] || 'there';

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wide">
          Welcome back, <span className="text-neon-cyan">{firstName}</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Manage your orders, profile, and wishlist.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/account/orders"
          className="group bg-surface border border-border rounded-lg p-5 hover:border-neon-cyan/30 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-5 h-5 text-neon-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span className="font-display text-sm uppercase tracking-wider group-hover:text-neon-cyan transition-colors">
              Orders
            </span>
          </div>
          <p className="text-gray-500 text-xs">View your order history and tracking</p>
        </Link>

        <Link
          href="/account/profile"
          className="group bg-surface border border-border rounded-lg p-5 hover:border-neon-purple/30 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-5 h-5 text-neon-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="font-display text-sm uppercase tracking-wider group-hover:text-neon-purple transition-colors">
              Profile
            </span>
          </div>
          <p className="text-gray-500 text-xs">Edit name and manage addresses</p>
        </Link>

        <Link
          href="/account/wishlist"
          className="group bg-surface border border-border rounded-lg p-5 hover:border-neon-red/30 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-5 h-5 text-neon-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            <span className="font-display text-sm uppercase tracking-wider group-hover:text-neon-red transition-colors">
              Wishlist
            </span>
          </div>
          <p className="text-gray-500 text-xs">Your saved products</p>
        </Link>
      </div>

      {/* Recent orders */}
      <div>
        <h2 className="font-display text-lg uppercase tracking-wider mb-4">Recent Orders</h2>
        {loading ? (
          <div className="bg-surface border border-border rounded-lg p-8 text-center">
            <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">No orders yet</p>
            <Link
              href="/products/red"
              className="inline-block border border-neon-cyan text-neon-cyan font-display text-sm uppercase tracking-wider px-6 py-2 rounded hover:bg-neon-cyan/10 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between bg-surface border border-border rounded-lg p-4 hover:border-neon-cyan/20 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-body">
                      Order <span className="text-gray-400">#{order.id.slice(0, 8)}</span>
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-display">
                    ${(order.amountTotal / 100).toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
            {recentOrders.length > 0 && (
              <Link
                href="/account/orders"
                className="block text-center text-sm text-neon-cyan hover:underline mt-2"
              >
                View all orders
              </Link>
            )}
          </div>
        )}
      </div>
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
