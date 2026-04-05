'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';

export function CartToast() {
  const [show, setShow] = useState(false);
  const [lastCount, setLastCount] = useState(0);
  const itemCount = useCartStore((s) => s.getItemCount());
  const items = useCartStore((s) => s.items);

  useEffect(() => {
    // Show toast when item count increases (not on initial mount)
    if (itemCount > lastCount && lastCount > 0) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3500);
      return () => clearTimeout(timer);
    }
    setLastCount(itemCount);
  }, [itemCount, lastCount]);

  // Track initial mount
  useEffect(() => {
    setLastCount(itemCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show || items.length === 0) return null;

  const lastItem = items[items.length - 1];

  return (
    <div className="fixed top-20 right-4 z-50 animate-[slide-in-right_0.3s_ease-out]">
      <div className="bg-surface border border-neon-cyan/30 rounded-xl shadow-lg shadow-black/50 p-4 max-w-xs w-72">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-6 rounded-full bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-neon-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="font-display text-xs uppercase tracking-wider text-neon-cyan font-bold">
            Added to Cart
          </p>
          <button
            onClick={() => setShow(false)}
            className="ml-auto text-gray-600 hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-foreground font-body truncate">{lastItem.name}</p>
        <p className="text-xs text-gray-500 font-body">${lastItem.price.toFixed(2)} &times; {lastItem.quantity}</p>

        <div className="flex gap-2 mt-3">
          <Link
            href="/cart"
            onClick={() => setShow(false)}
            className="flex-1 text-center border border-neon-cyan text-neon-cyan font-display text-xs uppercase tracking-wider px-3 py-2 rounded hover:bg-neon-cyan/10 transition-colors"
          >
            View Cart ({itemCount})
          </Link>
          <button
            onClick={() => setShow(false)}
            className="text-xs text-gray-500 hover:text-gray-300 font-body px-3 py-2 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
