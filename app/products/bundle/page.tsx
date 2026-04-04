import { notFound } from 'next/navigation';
import Image from 'next/image';
import { AddToCartButton } from '@/components/AddToCartButton';
import { VitruvianMan } from '@/components/VitruvianMan';
import { ProductGallery } from '@/components/ProductGallery';
import { readData } from '@/lib/data-store';
import type { Product } from '@/lib/products';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'SWZZLE BUNDLE | The Complete System',
  description: 'The full pre-round and post-round liniment system. Save $5.',
};

export default async function BundleProductPage() {
  const products = await readData<Product[]>('products.json');
  const product = products.find((p) => p.id === 'bundle');
  if (!product) return notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Vitruvian */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
          <VitruvianMan color="#b600ff" size={800} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Both Product Images */}
            <div className="flex items-center justify-center gap-4">
              <div className="relative w-[220px] h-[360px] -rotate-3">
                <Image
                  src="/labels/red-label.svg"
                  alt="Swzzle Red Liniment"
                  fill
                  className="object-contain drop-shadow-[0_0_30px_rgba(255,32,32,0.3)]"
                  priority
                />
              </div>
              <div className="relative w-[220px] h-[360px] rotate-3">
                <Image
                  src="/labels/blue-label.svg"
                  alt="Swzzle Blue Liniment"
                  fill
                  className="object-contain drop-shadow-[0_0_30px_rgba(0,245,255,0.3)]"
                  priority
                />
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="space-y-6">
              <div>
                <p className="font-body text-sm uppercase tracking-[0.3em] text-neon-purple/70 mb-2">
                  Complete Warm-Up + Cool-Down System
                </p>
                <h1 className="font-display text-4xl lg:text-5xl font-bold text-neon-purple tracking-wider">
                  SWZZLE BUNDLE
                </h1>
                <p className="font-display text-xl text-neon-purple/60 mt-1 tracking-widest">
                  | The Complete System
                </p>
              </div>

              <div className="flex items-baseline gap-4">
                <p className="font-display text-3xl font-bold text-foreground">
                  ${product.price}
                </p>
                <p className="font-body text-sm text-neon-purple/80 line-through decoration-neon-purple/40">
                  $49.98
                </p>
                <span className="font-display text-xs font-bold uppercase tracking-wider bg-neon-purple/20 text-neon-purple border border-neon-purple/30 px-3 py-1 rounded-full">
                  Save $5
                </span>
              </div>

              <p className="font-body text-foreground/80 leading-relaxed text-lg">
                {product.shortDescription}
              </p>

              <AddToCartButton product={product} />

              <div className="flex items-center gap-3 pt-2">
                <span className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
                <span className="font-body text-sm text-foreground/50">
                  In stock — ships within 2 business days
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Gallery Images */}
      {product.images && product.images.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <ProductGallery
            mainImage={product.image}
            images={product.images}
            alt="Swzzle Bundle"
            color="#b600ff"
          />
        </section>
      )}

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-neon-purple/30 to-transparent" />
      </div>

      {/* Description Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-2xl text-neon-purple tracking-wider mb-6">
          THE FULL PROTOCOL
        </h2>
        <p className="font-body text-foreground/80 leading-relaxed max-w-3xl text-lg">
          {product.longDescription}
        </p>
      </section>

      {/* What's Included */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-display text-2xl text-neon-purple tracking-wider mb-10">
            WHAT&apos;S INCLUDED
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Red Card */}
            <div className="bg-background border border-neon-red/20 rounded-lg p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 opacity-10">
                <VitruvianMan color="#FF2020" size={120} />
              </div>
              <div className="relative">
                <h3 className="font-display text-xl text-neon-red tracking-wider mb-2">
                  SWZZLE RED
                </h3>
                <p className="font-display text-sm text-neon-red/60 tracking-widest mb-4">
                  WARM UP — PRE-ROUND
                </p>
                <p className="font-body text-foreground/60 leading-relaxed">
                  Capsaicin-driven heat engine. Apply 15-20 minutes before activity
                  to get blood moving to cold, stiff muscles. Shoulders, forearms,
                  hip flexors — game-ready from hole one.
                </p>
              </div>
            </div>

            {/* Blue Card */}
            <div className="bg-background border border-neon-cyan/20 rounded-lg p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 opacity-10">
                <VitruvianMan color="#00F5FF" size={120} />
              </div>
              <div className="relative">
                <h3 className="font-display text-xl text-neon-cyan tracking-wider mb-2">
                  SWZZLE BLUE
                </h3>
                <p className="font-display text-sm text-neon-cyan/60 tracking-widest mb-4">
                  COOL DOWN — POST-ROUND
                </p>
                <p className="font-body text-foreground/60 leading-relaxed">
                  Menthol and eucalyptus cooling up front, castor oil and turmeric
                  working overnight. Your body did the work — Swzzle Blue is how
                  you say thanks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Directions & Warnings */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Directions */}
          <div className="bg-surface border border-border rounded-lg p-8">
            <h2 className="font-display text-xl text-neon-purple tracking-wider mb-4">
              DIRECTIONS
            </h2>
            <p className="font-body text-foreground/70 leading-relaxed">
              {product.directions}
            </p>
          </div>

          {/* Warnings */}
          <div className="bg-surface border border-neon-purple/20 rounded-lg p-8">
            <h2 className="font-display text-xl text-neon-purple tracking-wider mb-4">
              ⚠ WARNINGS
            </h2>
            <p className="font-body text-foreground/70 leading-relaxed">
              {product.warnings}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
