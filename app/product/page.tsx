import Image from 'next/image';
import { readData } from '@/lib/data-store';
import type { Product } from '@/lib/products';
import { AddToStickButton } from '@/components/AddToStickButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Swzzle Liniment Stick — Upgrade the Hardware',
  description: 'The single topical stick engineered for competitive athletes. Full Stack sensation, zero mess. $19.99.',
};

export default async function ProductPage() {
  const products = await readData<Product[]>('products.json');
  const product = products.find((p) => p.status === 'active') || products[0];

  const ingredients = product.ingredients.split(',').map((s) => s.trim());

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Product Image */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[420px] aspect-square rounded-xl overflow-hidden" style={{ boxShadow: '0 0 60px rgba(0,229,255,0.15)' }}>
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 420px"
                />
              </div>
              {/* Gallery thumbnails if multiple images */}
              {product.images && product.images.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                  {product.images.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-border">
                      <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="64px" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Info */}
            <div className="space-y-5">
              <div>
                <p className="font-body text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-neon-cyan/70 mb-2">
                  Your New Warm-Up Routine
                </p>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-neon-cyan tracking-wider break-words">
                  SWZZLE LINIMENT STICK
                </h1>
                <p className="font-display text-lg sm:text-xl text-neon-cyan/60 mt-1 tracking-wide sm:tracking-widest">
                  Twist. Glide. Dominate.
                </p>
              </div>

              <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                ${product.price}
              </p>

              <p className="font-body text-foreground/80 leading-relaxed text-base sm:text-lg">
                {product.shortDescription}
              </p>

              <AddToStickButton product={product} />

              <div className="flex items-center gap-3 pt-2">
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                <span className="font-body text-sm text-foreground/50">
                  In stock — ships within 2 business days
                </span>
              </div>

              <p className="text-neon-cyan text-xs font-display uppercase tracking-widest animate-pulse">
                &#9733; Free Shipping on orders over $25
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
      </div>

      {/* Description */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-2xl text-neon-cyan tracking-wider mb-6">
          ABOUT THE STICK
        </h2>
        <p className="font-body text-foreground/80 leading-relaxed max-w-3xl text-base sm:text-lg">
          {product.longDescription}
        </p>
      </section>

      {/* Ingredients */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="font-display text-2xl text-neon-cyan tracking-wider mb-8">
            INGREDIENTS (INCI)
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ingredients.map((ingredient, i) => (
              <div key={i} className="flex items-start gap-3 font-body text-foreground/70">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-neon-cyan/60 shrink-0" />
                <span>{ingredient}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Directions & Warnings */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-surface border border-border rounded-lg p-6 sm:p-8">
            <h2 className="font-display text-xl text-neon-cyan tracking-wider mb-4">
              DIRECTIONS
            </h2>
            <p className="font-body text-foreground/70 leading-relaxed">
              {product.directions}
            </p>
          </div>

          <div className="bg-surface border border-neon-red/20 rounded-lg p-6 sm:p-8">
            <h2 className="font-display text-xl text-neon-red tracking-wider mb-4">
              WARNINGS
            </h2>
            <p className="font-body text-foreground/70 leading-relaxed">
              {product.warnings}
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="font-display font-black text-2xl sm:text-4xl tracking-wider mb-6 drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">
          Upgrade the Hardware.
        </h2>
        <AddToStickButton product={product} />
      </section>
    </main>
  );
}
