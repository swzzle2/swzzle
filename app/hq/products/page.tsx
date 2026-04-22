import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import { readData } from '@/lib/data-store';
import type { Product } from '@/lib/products';
import { ProductsList } from './ProductsList';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  if (!(await isAuthenticated())) {
    redirect('/hq/login');
  }

  const products = await readData<Product[]>('products.json');

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/hq/dashboard"
            className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors"
          >
            &larr; Dashboard
          </Link>
          <h1 className="font-display text-2xl text-neon-cyan tracking-wider mt-2">
            PRODUCTS
          </h1>
        </div>

        <ProductsList initialProducts={products} />
      </div>
    </div>
  );
}
