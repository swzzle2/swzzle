'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export function AccountMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-surface-light animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn('google')}
        className="text-sm font-display uppercase tracking-wider text-gray-400 hover:text-neon-cyan transition-colors"
      >
        Sign In
      </button>
    );
  }

  const user = session.user;
  const initials = (user.name || user.email || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 group"
        aria-label="Account menu"
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="w-8 h-8 rounded-full border border-border group-hover:border-neon-cyan transition-colors"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-surface-light border border-border group-hover:border-neon-cyan transition-colors flex items-center justify-center text-xs font-display font-bold text-neon-cyan">
            {initials}
          </div>
        )}
        <span className="hidden sm:inline text-sm font-display text-gray-400 group-hover:text-neon-cyan transition-colors">
          {user.name?.split(' ')[0] || 'Account'}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg shadow-black/50 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-display text-foreground truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-400 hover:text-neon-cyan hover:bg-surface-light transition-colors"
            >
              My Account
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-400 hover:text-neon-cyan hover:bg-surface-light transition-colors"
            >
              Orders
            </Link>
          </div>
          <div className="border-t border-border py-1">
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-neon-red hover:bg-surface-light transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
