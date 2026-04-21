import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import { readData } from '@/lib/data-store';
import type { Product } from '@/lib/products';
import { NewProductButton } from './NewProductButton';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  if (!(await isAuthenticated())) {
    redirect('/hq/login');
  }

  const products = await readData<Product[]>('products.json');

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
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
          <NewProductButton />
        </div>

        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                  NAME
                </th>
                <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                  PRICE
                </th>
                <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                  STATUS
                </th>
                <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                  MAIN PAGE
                </th>
                <th className="text-right p-4 font-display text-xs tracking-wider text-foreground/50">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-border/50 hover:bg-surface-light/30 transition-colors"
                >
                  <td className="p-4 font-body text-foreground">
                    {product.name}
                  </td>
                  <td className="p-4 font-body text-foreground/70">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-display tracking-wider ${
                        product.status === 'active'
                          ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
                          : 'bg-foreground/5 text-foreground/40 border border-foreground/10'
                      }`}
                    >
                      {product.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    {product.mainPageDisplay ? (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-display tracking-wider bg-neon-purple/10 text-neon-purple border border-neon-purple/30">
                        &#9733; MAIN
                      </span>
                    ) : (
                      <span className="text-foreground/30 text-xs font-body">—</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/hq/products/${product.id}`}
                      className="text-sm text-neon-cyan/70 hover:text-neon-cyan font-body transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
