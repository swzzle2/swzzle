'use client';

import { useState } from 'react';
import { useCartStore } from '@/lib/cart-store';
import type { Product } from '@/lib/products';

export function AddToCartButton({ product, className = '' }: { product: Product; className?: string }) {
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

  const borderColor = product.id === 'red' ? 'border-neon-red' :
    product.id === 'blue' ? 'border-neon-cyan' :
    'border-neon-purple';

  const textColor = product.id === 'red' ? 'text-neon-red' :
    product.id === 'blue' ? 'text-neon-cyan' :
    'text-neon-purple';

  const bgHover = product.id === 'red' ? 'hover:bg-neon-red/10' :
    product.id === 'blue' ? 'hover:bg-neon-cyan/10' :
    'hover:bg-neon-purple/10';

  const bgAdded = product.id === 'red' ? 'bg-neon-red' :
    product.id === 'blue' ? 'bg-neon-cyan' :
    'bg-neon-purple';

  if (added) {
    return (
      <button
        disabled
        className={`${bgAdded} text-background font-display font-bold uppercase tracking-wide sm:tracking-wider px-5 sm:px-8 py-3 rounded text-sm sm:text-base w-full sm:w-auto transition-all duration-300 flex items-center justify-center gap-2 ${className}`}
      >
        <svg className="w-5 h-5 animate-[scale-in_0.2s_ease-out]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Added to Cart!
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className={`border-2 ${borderColor} ${textColor} ${bgHover} font-display font-bold uppercase tracking-wide sm:tracking-wider px-5 sm:px-8 py-3 rounded transition-all duration-300 text-sm sm:text-base w-full sm:w-auto ${className}`}
    >
      {product.id === 'bundle' ? `Add Bundle to Cart — $${product.price}` : `Add to Cart — $${product.price}`}
    </button>
  );
}
