'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/cart-store';
import type { Product } from '@/lib/products';

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetchWishlist();
  }, []);

  async function fetchWishlist() {
    try {
      const res = await fetch('/api/customer/wishlist');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      }
    } catch {
      // will show empty state
    } finally {
      setLoading(false);
    }
  }

  async function removeFromWishlist(productId: string) {
    setRemovingId(productId);
    try {
      const res = await fetch('/api/customer/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== productId));
      }
    } catch {
      // silently fail
    } finally {
      setRemovingId(null);
    }
  }

  function handleAddToCart(product: Product) {
    addItem({
      id: product.id,
      name: product.name,
      descriptor: product.descriptor,
      price: product.price,
      image: product.image,
      color: product.color,
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide">Wishlist</h1>

      {products.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          <svg
            className="w-12 h-12 text-gray-600 mx-auto mb-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <p className="text-gray-500 mb-4">Your wishlist is empty</p>
          <Link
            href="/products/red"
            className="inline-block border border-neon-cyan text-neon-cyan font-display text-sm uppercase tracking-wider px-6 py-2.5 rounded hover:bg-neon-cyan/10 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const productUrl =
              product.id === 'bundle'
                ? '/products/bundle'
                : `/products/${product.id}`;
            return (
              <div
                key={product.id}
                className="bg-surface border border-border rounded-lg overflow-hidden group hover:border-neon-cyan/20 transition-all duration-200"
              >
                <Link href={productUrl} className="block relative aspect-square bg-background">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                <div className="p-4 space-y-3">
                  <div>
                    <Link href={productUrl}>
                      <h3 className="font-display text-sm uppercase tracking-wider group-hover:text-neon-cyan transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">{product.descriptor}</p>
                  </div>
                  <p className="font-display text-lg">${product.price}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 border border-neon-cyan text-neon-cyan font-display text-xs uppercase tracking-wider px-3 py-2 rounded hover:bg-neon-cyan/10 transition-colors"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      disabled={removingId === product.id}
                      className="border border-border text-gray-500 hover:text-neon-red hover:border-neon-red/30 px-3 py-2 rounded transition-colors disabled:opacity-50"
                      aria-label="Remove from wishlist"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
