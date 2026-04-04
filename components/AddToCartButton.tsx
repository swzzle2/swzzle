'use client';

import { useCartStore } from '@/lib/cart-store';
import type { Product } from '@/lib/products';

export function AddToCartButton({ product, className = '' }: { product: Product; className?: string }) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    if (product.id === 'bundle') {
      // Bundle adds as a single line item at the bundle price
      addItem({
        id: 'bundle',
        name: product.name,
        descriptor: product.descriptor,
        price: product.price,
        image: product.image,
        color: product.color,
      });
    } else {
      addItem({
        id: product.id,
        name: product.name,
        descriptor: product.descriptor,
        price: product.price,
        image: product.image,
        color: product.color,
      });
    }
  };

  const borderColor = product.id === 'red' ? 'border-neon-red hover:bg-neon-red/10' :
    product.id === 'blue' ? 'border-neon-cyan hover:bg-neon-cyan/10' :
    'border-neon-purple hover:bg-neon-purple/10';

  const textColor = product.id === 'red' ? 'text-neon-red' :
    product.id === 'blue' ? 'text-neon-cyan' :
    'text-neon-purple';

  return (
    <button
      onClick={handleAdd}
      className={`border-2 ${borderColor} ${textColor} font-display font-bold uppercase tracking-wider px-8 py-3 rounded transition-all duration-300 ${className}`}
    >
      {product.id === 'bundle' ? `Add Bundle to Cart — $${product.price}` : `Add to Cart — $${product.price}`}
    </button>
  );
}
