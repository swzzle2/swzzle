'use client';

import { useState } from 'react';
import { useCartStore } from '@/lib/cart-store';
import type { Product } from '@/lib/products';

export function AddToStickButton({ product, className = '' }: { product: Product; className?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      descriptor: product.descriptor,
      price: product.price,
      image: product.image,
      color: product.color,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (added) {
    return (
      <button
        disabled
        className={`bg-neon-cyan text-background font-display font-bold uppercase tracking-wider px-8 py-4 rounded text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,229,255,0.5)] ${className}`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Added!
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className={`border-2 border-neon-cyan text-neon-cyan font-display font-bold uppercase tracking-wider px-8 py-4 rounded text-base hover:bg-neon-cyan/10 hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all duration-300 ${className}`}
    >
      Get the Stick &mdash; ${product.price}
    </button>
  );
}
