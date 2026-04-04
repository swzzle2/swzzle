import { notFound } from 'next/navigation';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ProductGallery } from '@/components/ProductGallery';
import { readData } from '@/lib/data-store';
import type { Product } from '@/lib/products';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'SWZZLE RED LINIMENT | Warm Up',
  description: 'Capsaicin-driven pre-round heat engine for athletes.',
};

export default async function RedProductPage() {
  const products = await readData<Product[]>('products.json');
  const product = products.find((p) => p.id === 'red');
  if (!product) return notFound();

  const ingredients = product.ingredients.split(',').map((s) => s.trim());

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Product Gallery */}
            <div className="flex items-center justify-center">
              <ProductGallery
                mainImage={product.image}
                images={product.images || []}
                alt="Swzzle Red Liniment"
                color="#FF2020"
              />
            </div>

            {/* Right: Product Info */}
            <div className="space-y-5">
              <div>
                <p className="font-body text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-neon-red/70 mb-2">
                  Pre-Round Protocol
                </p>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-neon-red tracking-wider break-words">
                  SWZZLE RED LINIMENT
                </h1>
                <p className="font-display text-lg sm:text-xl text-neon-red/60 mt-1 tracking-wide sm:tracking-widest">
                  | Warm Up
                </p>
              </div>

              <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                ${product.price}
              </p>

              <p className="font-body text-foreground/80 leading-relaxed text-base sm:text-lg">
                {product.shortDescription}
              </p>

              <AddToCartButton product={product} />

              <div className="flex items-center gap-3 pt-2">
                <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                <span className="font-body text-sm text-foreground/50">
                  In stock — ships within 2 business days
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-neon-red/30 to-transparent" />
      </div>

      {/* Description Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-2xl text-neon-red tracking-wider mb-6">
          ABOUT THIS FORMULA
        </h2>
        <p className="font-body text-foreground/80 leading-relaxed max-w-3xl text-lg">
          {product.longDescription}
        </p>
      </section>

      {/* Ingredients Section */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-display text-2xl text-neon-red tracking-wider mb-8">
            INGREDIENTS
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ingredients.map((ingredient, i) => (
              <div
                key={i}
                className="flex items-start gap-3 font-body text-foreground/70"
              >
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-neon-red/60 shrink-0" />
                <span>{ingredient}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Directions & Warnings */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Directions */}
          <div className="bg-surface border border-border rounded-lg p-8">
            <h2 className="font-display text-xl text-neon-red tracking-wider mb-4">
              DIRECTIONS
            </h2>
            <p className="font-body text-foreground/70 leading-relaxed">
              {product.directions}
            </p>
          </div>

          {/* Warnings */}
          <div className="bg-surface border border-neon-red/20 rounded-lg p-8">
            <h2 className="font-display text-xl text-neon-red tracking-wider mb-4">
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
