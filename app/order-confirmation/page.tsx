'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useCartStore } from '@/lib/cart-store';

type SessionData = {
  amount_total: number | null;
  currency: string;
  status: string;
  line_items?: {
    data: {
      description: string;
      quantity: number;
      amount_total: number;
    }[];
  };
};

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const clearCart = useCartStore((s) => s.clearCart);

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Clear cart on successful order
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders/session?id=${sessionId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then((data) => {
        setSession(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-12 md:py-20">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-neon-purple/5 rounded-full blur-3xl" />
      </div>

      {/* Success icon */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-neon-cyan mb-6 shadow-[0_0_30px_rgba(0,245,255,0.3)]">
          <span className="text-neon-cyan text-4xl">&#10003;</span>
        </div>
        <h1 className="font-display font-black text-3xl md:text-5xl tracking-wider mb-3">
          ORDER CONFIRMED
        </h1>
        <p className="text-gray-400 font-body text-lg">
          Thanks for your order. Your Swzzle is on the way.
        </p>
      </div>

      {/* Order details */}
      {session && !error && (
        <div className="border border-border rounded-xl bg-surface p-6 md:p-8 mb-10">
          <h2 className="font-display font-bold text-lg tracking-wider text-gray-400 mb-4">
            ORDER SUMMARY
          </h2>

          {session.line_items?.data && session.line_items.data.length > 0 && (
            <div className="space-y-3 mb-6">
              {session.line_items.data.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-2 border-b border-border last:border-0"
                >
                  <div>
                    <span className="text-foreground font-body">
                      {item.description}
                    </span>
                    <span className="text-gray-600 text-sm ml-2">
                      x{item.quantity}
                    </span>
                  </div>
                  <span className="font-display font-bold">
                    ${(item.amount_total / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {session.amount_total !== null && (
            <div className="flex justify-between items-center pt-4 border-t border-border">
              <span className="font-display font-bold tracking-wider text-gray-400">
                TOTAL
              </span>
              <span className="font-display font-black text-2xl text-neon-cyan">
                ${(session.amount_total / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="border border-border rounded-xl bg-surface p-6 mb-10 text-center">
          <p className="text-gray-500">
            We couldn&apos;t load your order details, but your payment was
            processed. Check your email for a receipt.
          </p>
        </div>
      )}

      {/* Share prompt */}
      <div className="border border-border rounded-xl bg-surface p-6 md:p-8 mb-10 text-center">
        <h2 className="font-display font-bold text-lg tracking-wider mb-3">
          SHARE YOUR ROUND
        </h2>
        <p className="text-gray-500 font-body text-sm mb-5">
          Let your crew know you&apos;re geared up. Tag us @swzzle.
        </p>
        <div className="flex justify-center gap-4">
          <button className="border border-border rounded-lg px-6 py-2 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50 transition-colors font-display text-sm uppercase tracking-wider">
            Twitter / X
          </button>
          <button className="border border-border rounded-lg px-6 py-2 text-gray-400 hover:text-neon-purple hover:border-neon-purple/50 transition-colors font-display text-sm uppercase tracking-wider">
            Instagram
          </button>
        </div>
      </div>

      {/* Back to home */}
      <div className="text-center">
        <Link
          href="/"
          className="text-gray-500 hover:text-neon-cyan font-display text-sm uppercase tracking-wider transition-colors"
        >
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
