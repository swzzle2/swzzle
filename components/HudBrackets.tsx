'use client';

import { ReactNode } from 'react';

export function HudBrackets({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative p-6 md:p-10 ${className}`}>
      {/* Top-left corner */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-neon-cyan/60 shadow-[0_0_8px_rgba(0,229,255,0.3)]" />
      {/* Top-right corner */}
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-neon-cyan/60 shadow-[0_0_8px_rgba(0,229,255,0.3)]" />
      {/* Bottom-left corner */}
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-neon-cyan/60 shadow-[0_0_8px_rgba(0,229,255,0.3)]" />
      {/* Bottom-right corner */}
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-neon-cyan/60 shadow-[0_0_8px_rgba(0,229,255,0.3)]" />
      {children}
    </div>
  );
}
