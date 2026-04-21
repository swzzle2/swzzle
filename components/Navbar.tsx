'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useState, useEffect } from 'react';
import { AccountMenu } from '@/components/AccountMenu';

export function Navbar() {
  const itemCount = useCartStore((s) => s.getItemCount());
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="font-display font-black text-2xl tracking-wider text-foreground hover:text-neon-cyan transition-colors">
          SWZZLE
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/product" className="text-sm font-display uppercase tracking-wider text-gray-400 hover:text-neon-cyan transition-colors">
            Liniment Stick
          </Link>
          <Link href="/cart" className="relative text-sm font-display uppercase tracking-wider text-gray-400 hover:text-foreground transition-colors">
            Cart
            {mounted && itemCount > 0 && (
              <span className="absolute -top-2 -right-4 bg-neon-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>
          <AccountMenu />
        </div>

        {/* Mobile cart + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/cart" className="relative text-foreground p-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            {mounted && itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-neon-red text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-foreground p-2"
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-3">
          <Link href="/product" onClick={() => setMenuOpen(false)} className="block text-sm font-display uppercase tracking-wider text-gray-400 hover:text-neon-cyan">Liniment Stick</Link>
          <Link href="/cart" onClick={() => setMenuOpen(false)} className="block text-sm font-display uppercase tracking-wider text-gray-400">
            Cart {mounted && itemCount > 0 && `(${itemCount})`}
          </Link>
          <Link href="/account" onClick={() => setMenuOpen(false)} className="block text-sm font-display uppercase tracking-wider text-gray-400 hover:text-neon-cyan">Account</Link>
        </div>
      )}
    </nav>
  );
}
