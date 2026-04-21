import Image from 'next/image';
import Link from 'next/link';
import { readData } from '@/lib/data-store';
import type { Product } from '@/lib/products';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Swzzle — Liniment Sticks',
  description: 'The Swzzle product lineup. Full Stack sensation in a zero-mess solid stick.',
};

export default async function ProductIndexPage() {
  const products = await readData<Product[]>('products.json');
  const active = products.filter((p) => p.status === 'active');

  // If only one active product, still show as grid for consistency; user can always click in.
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
        <h1 className="font-display text-3xl sm:text-5xl font-black text-neon-cyan tracking-wider mb-10 text-center">
          THE LINEUP
        </h1>

        {active.length === 0 ? (
          <p className="text-center text-foreground/60 font-body">No products available right now.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group bg-surface border border-border rounded-xl overflow-hidden hover:border-neon-cyan/50 hover:shadow-[0_0_40px_rgba(0,229,255,0.15)] transition-all"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-5 space-y-1">
                  <h2 className="font-display text-xl text-foreground tracking-wider">
                    {product.name}
                  </h2>
                  <p className="font-display text-sm text-neon-cyan/70 tracking-wide">
                    {product.descriptor}
                  </p>
                  <p className="font-display text-lg text-foreground pt-1">
                    ${product.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
