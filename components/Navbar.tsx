'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useState } from 'react';

export function Navbar() {
  const itemCount = useCartStore((s) => s.getItemCount());
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="font-display font-black text-2xl tracking-wider text-foreground hover:text-neon-cyan transition-colors">
          SWZZLE
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/products/red" className="text-sm font-display uppercase tracking-wider text-gray-400 hover:text-neon-red transition-colors">
            Red
          </Link>
          <Link href="/products/blue" className="text-sm font-display uppercase tracking-wider text-gray-400 hover:text-neon-cyan transition-colors">
            Blue
          </Link>
          <Link href="/products/bundle" className="text-sm font-display uppercase tracking-wider text-gray-400 hover:text-neon-purple transition-colors">
            Bundle
          </Link>
          <Link href="/blog" className="text-sm font-display uppercase tracking-wider text-gray-400 hover:text-foreground transition-colors">
            Blog
          </Link>
          <Link href="/about" className="text-sm font-display uppercase tracking-wider text-gray-400 hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/cart" className="relative text-sm font-display uppercase tracking-wider text-gray-400 hover:text-foreground transition-colors">
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-4 bg-neon-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-foreground p-2"
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-3">
          <Link href="/products/red" onClick={() => setMenuOpen(false)} className="block text-sm font-display uppercase tracking-wider text-gray-400 hover:text-neon-red">Red</Link>
          <Link href="/products/blue" onClick={() => setMenuOpen(false)} className="block text-sm font-display uppercase tracking-wider text-gray-400 hover:text-neon-cyan">Blue</Link>
          <Link href="/products/bundle" onClick={() => setMenuOpen(false)} className="block text-sm font-display uppercase tracking-wider text-gray-400 hover:text-neon-purple">Bundle</Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)} className="block text-sm font-display uppercase tracking-wider text-gray-400">Blog</Link>
          <Link href="/about" onClick={() => setMenuOpen(false)} className="block text-sm font-display uppercase tracking-wider text-gray-400">About</Link>
          <Link href="/cart" onClick={() => setMenuOpen(false)} className="block text-sm font-display uppercase tracking-wider text-gray-400">
            Cart {itemCount > 0 && `(${itemCount})`}
          </Link>
        </div>
      )}
    </nav>
  );
}
