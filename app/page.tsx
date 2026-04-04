'use client';

import Link from 'next/link';
import Image from 'next/image';
import { VitruvianMan } from '@/components/VitruvianMan';

const mechanisms = [
  {
    name: 'Castor Oil',
    detail: 'Ricinoleic acid — deep tissue penetration carrier',
    icon: '01',
  },
  {
    name: 'Capsaicin',
    detail: 'Drives blood flow to cold, stiff muscles (Red only)',
    icon: '02',
  },
  {
    name: 'Turmeric CO2 Extract',
    detail: 'Curcumin concentrate — the good stuff, not the grocery store powder',
    icon: '03',
  },
  {
    name: 'Piperine (Black Pepper)',
    detail: 'Boosts curcumin absorption by up to 2000%',
    icon: '04',
  },
  {
    name: 'Camphor + Menthol',
    detail: 'Heat-cool sensation — immediate effect you can feel working',
    icon: '05',
  },
];

const products = [
  {
    id: 'red',
    name: 'SWZZLE RED',
    descriptor: 'Warm Up',
    price: '$24.99',
    color: '#FF2020',
    borderClass: 'neon-border-red',
    textClass: 'text-neon-red',
    image: '/labels/red-label.png',
  },
  {
    id: 'blue',
    name: 'SWZZLE BLUE',
    descriptor: 'Cool Down',
    price: '$24.99',
    color: '#00F5FF',
    borderClass: 'neon-border-cyan',
    textClass: 'text-neon-cyan',
    image: '/labels/blue-label.png',
  },
  {
    id: 'bundle',
    name: 'THE BUNDLE',
    descriptor: 'The Complete System',
    price: '$44.99',
    color: '#b600ff',
    borderClass: 'neon-border-purple',
    textClass: 'text-neon-purple',
    image: '/labels/bundle.png',
  },
];

export default function HomePage() {
  return (
    <div className="star-field">
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-red/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Vitruvian Man */}
          <div className="mb-8 animate-float">
            <VitruvianMan size={250} />
          </div>

          {/* Wordmark */}
          <h1
            className="font-display font-black tracking-[0.2em] text-foreground mb-4"
            style={{ fontSize: 'clamp(48px, 12vw, 140px)' }}
          >
            SWZZLE
          </h1>

          {/* Tagline */}
          <p className="font-display text-sm md:text-lg uppercase tracking-[0.3em] text-gray-400 mb-10">
            Built From The Same Dirt We Play On
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/products/red"
              className="border-2 border-neon-red text-neon-red font-display font-bold uppercase tracking-wider px-10 py-4 rounded hover:bg-neon-red/10 transition-all duration-300 neon-text-red"
            >
              Get Red
            </Link>
            <Link
              href="/products/blue"
              className="border-2 border-neon-cyan text-neon-cyan font-display font-bold uppercase tracking-wider px-10 py-4 rounded hover:bg-neon-cyan/10 transition-all duration-300 neon-text-cyan"
            >
              Get Blue
            </Link>
          </div>
        </div>
      </section>

      {/* PRODUCT TRIO */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className={`border ${p.borderClass} rounded-xl p-8 bg-surface hover:scale-[1.02] transition-all duration-300 flex flex-col items-center text-center group`}
            >
              <div className="w-40 h-52 relative mb-6">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className={`font-display font-black text-xl tracking-wider ${p.textClass}`}>
                {p.name}
              </h3>
              <p className="text-gray-500 text-sm font-display uppercase tracking-wider mt-1">
                {p.descriptor}
              </p>
              <p className={`font-display font-bold text-2xl mt-4 ${p.textClass}`}>
                {p.price}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* THE STACK — Science Breakdown */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="font-display font-black text-3xl md:text-5xl text-center mb-4 tracking-wider">
          THE STACK
        </h2>
        <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">
          Five mechanisms. One system. Every ingredient earns its spot or gets cut.
        </p>

        <div className="space-y-8">
          {mechanisms.map((m) => (
            <div key={m.icon} className="flex items-start gap-6 group">
              <div className="flex-shrink-0 w-14 h-14 rounded-lg border border-border bg-surface-light flex items-center justify-center font-display font-bold text-neon-cyan text-lg">
                {m.icon}
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground group-hover:text-neon-cyan transition-colors">
                  {m.name}
                </h3>
                <p className="text-gray-500 text-sm mt-1">{m.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="font-display font-black text-2xl md:text-4xl text-center mb-12 tracking-wider">
          WHAT THEY&apos;RE SAYING
        </h2>
        {/* TODO: Replace with real reviews */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border rounded-xl p-6 bg-surface">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-neon-cyan">&#9733;</span>
                ))}
              </div>
              <p className="text-gray-400 text-sm italic mb-4">
                &ldquo;Review placeholder — real testimonials coming soon.&rdquo;
              </p>
              <p className="text-gray-600 text-xs font-display uppercase tracking-wider">
                — Athlete #{i}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TOURNAMENT SECTION */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display font-black text-2xl md:text-4xl mb-4 tracking-wider">
          OUTFIT YOUR TOURNAMENT
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto mb-8">
          Running a tournament? Get Swzzle into every player&apos;s bag.
          TD player packs at wholesale pricing. $18/unit, minimum 24 units.
        </p>
        <a
          href="mailto:hello@swzzle.com?subject=Tournament%20Player%20Packs"
          className="inline-block border-2 border-neon-purple text-neon-purple font-display font-bold uppercase tracking-wider px-10 py-4 rounded hover:bg-neon-purple/10 transition-all duration-300"
        >
          Get Tournament Pricing
        </a>
      </section>
    </div>
  );
}
