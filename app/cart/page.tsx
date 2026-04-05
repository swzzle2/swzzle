'use client';

import { useCartStore } from '@/lib/cart-store';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, clearCart } =
    useCartStore();
  const [freeShippingThreshold] = useState(25);
  const [checkingOut, setCheckingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; percentOff?: number; amountOff?: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const FLAT_RATE_SHIPPING = 7.99;

  useEffect(() => {
    setMounted(true);
  }, []);

  const subtotal = getSubtotal();
  const qualifiesFreeShipping = subtotal >= freeShippingThreshold;

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponApplied(null);

    try {
      const res = await fetch(`/api/coupon/validate?code=${encodeURIComponent(couponCode.trim().toUpperCase())}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setCouponError(data.error || 'Invalid coupon code');
      } else {
        setCouponApplied({
          code: data.code,
          percentOff: data.percentOff,
          amountOff: data.amountOff,
        });
      }
    } catch {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCouponApplied(null);
    setCouponCode('');
    setCouponError('');
  }

  const discount = couponApplied
    ? couponApplied.percentOff
      ? subtotal * (couponApplied.percentOff / 100)
      : couponApplied.amountOff
      ? couponApplied.amountOff / 100
      : 0
    : 0;
  const shipping = qualifiesFreeShipping ? 0 : FLAT_RATE_SHIPPING;
  const total = Math.max(0, subtotal - discount + shipping);

  async function handleCheckout() {
    setCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
          couponCode: couponApplied?.code || undefined,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Something went wrong. Please try again.');
        setCheckingOut(false);
      }
    } catch {
      alert('Something went wrong. Please try again.');
      setCheckingOut(false);
    }
  }

  // Avoid hydration mismatch with persisted zustand store
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-6 opacity-30">&#128722;</div>
        <h1 className="font-display font-black text-3xl md:text-4xl tracking-wider mb-4">
          YOUR CART IS EMPTY
        </h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Looks like you haven&apos;t added anything yet. Head back to the shop
          and gear up.
        </p>
        <Link
          href="/products"
          className="border-2 border-neon-cyan text-neon-cyan font-display font-bold uppercase tracking-wider px-10 py-4 rounded hover:bg-neon-cyan/10 transition-all duration-300"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-12 md:py-20">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-neon-cyan/5 rounded-full blur-3xl" />
      </div>

      <h1 className="font-display font-black text-3xl md:text-5xl tracking-wider mb-10">
        YOUR CART
      </h1>

      {/* Items */}
      <div className="space-y-6 mb-10">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-border rounded-xl bg-surface p-4 md:p-6 flex gap-4 md:gap-6 items-center group hover:border-gray-600 transition-colors"
          >
            {/* Image */}
            <div className="relative w-20 h-24 md:w-24 md:h-32 flex-shrink-0">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-contain"
              />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3
                className="font-display font-bold text-lg tracking-wider truncate"
                style={{ color: item.color }}
              >
                {item.name}
              </h3>
              <p className="text-gray-500 text-sm font-display uppercase tracking-wider">
                {item.descriptor}
              </p>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded border border-border bg-surface-light flex items-center justify-center text-gray-400 hover:text-foreground hover:border-gray-500 transition-colors font-display font-bold"
                >
                  -
                </button>
                <span className="font-display font-bold text-lg w-8 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded border border-border bg-surface-light flex items-center justify-center text-gray-400 hover:text-foreground hover:border-gray-500 transition-colors font-display font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price + Remove */}
            <div className="flex flex-col items-end gap-2">
              <p className="font-display font-bold text-xl">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
              <button
                onClick={() => removeItem(item.id)}
                className="text-gray-600 hover:text-neon-red text-sm font-body transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="border border-border rounded-xl bg-surface p-6 md:p-8">
        {/* Free shipping badge */}
        {qualifiesFreeShipping && (
          <div className="flex items-center gap-2 mb-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg px-4 py-2">
            <span className="text-neon-cyan text-lg">&#10003;</span>
            <span className="text-neon-cyan font-display font-bold text-sm uppercase tracking-wider">
              Free Shipping Unlocked
            </span>
          </div>
        )}
        {!qualifiesFreeShipping && (
          <div className="mb-4 text-gray-500 text-sm font-body">
            Shipping: $7.99 flat rate. <span className="text-neon-cyan">Free shipping on orders over $25!</span>
          </div>
        )}

        {/* Coupon Code */}
        <div className="mb-6">
          {couponApplied ? (
            <div className="flex items-center justify-between bg-neon-purple/10 border border-neon-purple/30 rounded-lg px-4 py-3">
              <div>
                <span className="font-display text-sm uppercase tracking-wider text-neon-purple font-bold">
                  {couponApplied.code}
                </span>
                <span className="text-gray-400 text-sm ml-2">
                  {couponApplied.percentOff
                    ? `${couponApplied.percentOff}% off`
                    : `$${((couponApplied.amountOff || 0) / 100).toFixed(2)} off`}
                </span>
              </div>
              <button
                onClick={removeCoupon}
                className="text-gray-500 hover:text-neon-red text-xs font-body transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                className="flex-1 bg-background border border-border rounded px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-neon-purple/50 transition-colors placeholder:text-gray-600 font-display uppercase tracking-wider"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="border border-neon-purple text-neon-purple font-display text-xs uppercase tracking-wider px-4 py-2.5 rounded hover:bg-neon-purple/10 transition-colors disabled:opacity-50"
              >
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
          )}
          {couponError && (
            <p className="text-neon-red text-xs mt-2 font-body">{couponError}</p>
          )}
        </div>

        <div className="flex justify-between items-center mb-2">
          <span className="font-display text-sm tracking-wider text-gray-500">SUBTOTAL</span>
          <span className="font-display font-bold text-lg text-gray-400">${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center mb-2">
            <span className="font-display text-sm tracking-wider text-neon-purple">DISCOUNT</span>
            <span className="font-display font-bold text-lg text-neon-purple">-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center mb-2">
          <span className="font-display text-sm tracking-wider text-gray-500">SHIPPING</span>
          <span className={`font-display font-bold text-lg ${qualifiesFreeShipping ? 'text-neon-cyan' : 'text-gray-400'}`}>
            {qualifiesFreeShipping ? 'FREE' : `$${FLAT_RATE_SHIPPING.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between items-center mb-6 pt-2 border-t border-border">
          <span className="font-display font-bold text-lg tracking-wider text-gray-400">TOTAL</span>
          <span className="font-display font-black text-2xl md:text-3xl">${total.toFixed(2)}</span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={checkingOut}
          className="w-full bg-neon-cyan text-background font-display font-black uppercase tracking-wider text-lg py-4 rounded-lg hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkingOut ? 'Redirecting to Checkout...' : 'Checkout'}
        </button>

        <button
          onClick={clearCart}
          className="w-full mt-3 text-gray-600 hover:text-gray-400 font-body text-sm transition-colors"
        >
          Clear Cart
        </button>
      </div>

      {/* Continue shopping link */}
      <div className="text-center mt-8">
        <Link
          href="/products"
          className="text-gray-500 hover:text-neon-cyan font-display text-sm uppercase tracking-wider transition-colors"
        >
          &larr; Continue Shopping
        </Link>
      </div>
    </div>
  );
}
