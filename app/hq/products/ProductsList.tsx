'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/products';

const LINIMENT_STICK_ROUGH = {
  name: 'Swzzle Liniment Stick',
  descriptor: 'Twist. Glide. Dominate.',
  price: 19.99,
  shortDescription:
    "The savage reply your body's been waiting for. Full Stack sensation in a zero-mess solid stick. Twist, glide, and feel it build on your throwing arm, shoulders, or whatever you punished on the last round.",
  longDescription:
    'Swzzle Liniment Stick runs the Full Stack — oil of wintergreen, menthol, camphor, eucalyptus, ginger, black pepper, cinnamon bark — stacked deliberately so every sensation hits without crossing the line. More sensation you can feel. Better glide. Zero mess. Zero jelly hands. Zero gym bag crime scene. Just the Full Stack and the sensation.',
  ingredients:
    'Stearic Acid, Ricinus Communis (Castor) Seed Oil, Cocos Nucifera (Coconut) Oil, Methyl Salicylate, Camphor, Menthol, Zingiber Officinale (Ginger) Root Oil, Eucalyptus Globulus Leaf Oil, Piper Nigrum (Black Pepper) Seed Oil, Prunus Armeniaca (Apricot) Kernel Oil, Tocopherol, Cinnamomum Zeylanicum (Cinnamon) Bark Oil',
  directions:
    'Pop the cap, twist up the stick. Run it over your throwing arm, shoulders, lower back — wherever the last round punished you. Feel it build. No mess. No jelly hands.',
  warnings:
    'For external use only. Avoid contact with eyes and mucous membranes. Do not apply to broken or irritated skin. Keep out of reach of children. Discontinue use if irritation occurs.',
  image: '/labels/red-label.svg',
  color: '#00E5FF',
};

export function ProductsList({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [newName, setNewName] = useState('');
  const [busyId, setBusyId] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function note(msg: string) {
    setMessage(msg);
    setError('');
    setTimeout(() => setMessage(''), 3000);
  }

  function fail(msg: string) {
    setError(msg);
    setMessage('');
  }

  async function refresh() {
    const res = await fetch('/api/admin/products', { cache: 'no-store' });
    if (res.ok) setProducts(await res.json());
  }

  async function createProduct(body: Record<string, unknown>) {
    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Create failed');
    }
    return res.json();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError('');
    try {
      const data = await createProduct({ name });
      setNewName('');
      router.push(`/hq/products/${data.product.id}`);
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  }

  async function handleSeedLinimentStick() {
    if (products.some((p) => p.name.toLowerCase() === 'swzzle liniment stick')) {
      fail('Swzzle Liniment Stick already exists');
      return;
    }
    setSeeding(true);
    setError('');
    try {
      const data = await createProduct(LINIMENT_STICK_ROUGH);
      note('Swzzle Liniment Stick created — opening editor so you can add images.');
      router.push(`/hq/products/${data.product.id}`);
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Seed failed');
    } finally {
      setSeeding(false);
    }
  }

  async function setAsMainPage(product: Product) {
    setBusyId(product.id);
    setError('');
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, mainPageDisplay: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      note(`${product.name} is now the main page product.`);
      await refresh();
      router.refresh();
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId('');
    }
  }

  async function toggleStatus(product: Product) {
    setBusyId(product.id);
    setError('');
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          status: product.status === 'active' ? 'inactive' : 'active',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      await refresh();
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId('');
    }
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setBusyId(product.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(product.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      note(`${product.name} deleted.`);
      await refresh();
      router.refresh();
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId('');
    }
  }

  const hasLinimentStick = products.some(
    (p) => p.name.toLowerCase() === 'swzzle liniment stick',
  );

  return (
    <div className="space-y-6">
      {/* Create row */}
      <div className="bg-surface border border-border rounded-lg p-4 md:p-6">
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="font-display text-xs tracking-wider text-foreground/50 sm:w-28">
            NEW PRODUCT
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Product name"
            className="neon-input flex-1"
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="px-5 py-2.5 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-display text-sm tracking-wider uppercase rounded-md hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
          >
            {creating ? 'Creating…' : '+ Create'}
          </button>
        </form>

        {!hasLinimentStick && (
          <div className="mt-4 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <p className="text-sm font-body text-foreground/60">
              Need the flagship stick as a standalone product?
            </p>
            <button
              type="button"
              onClick={handleSeedLinimentStick}
              disabled={seeding}
              className="px-4 py-2 bg-neon-purple/10 border border-neon-purple/60 text-neon-purple font-display text-xs tracking-wider uppercase rounded-md hover:bg-neon-purple/20 transition-all disabled:opacity-50"
            >
              {seeding ? 'Creating…' : '+ Rough in Swzzle Liniment Stick'}
            </button>
          </div>
        )}

        {(message || error) && (
          <p
            className={`mt-3 text-sm font-body ${
              error ? 'text-neon-red' : 'text-neon-cyan'
            }`}
          >
            {error || message}
          </p>
        )}
      </div>

      {/* Table */}
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
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-foreground/40 font-body text-sm">
                  No products yet. Create one above.
                </td>
              </tr>
            )}
            {products.map((product) => {
              const busy = busyId === product.id;
              return (
                <tr
                  key={product.id}
                  className="border-b border-border/50 hover:bg-surface-light/30 transition-colors"
                >
                  <td className="p-4 font-body text-foreground">
                    <Link href={`/hq/products/${product.id}`} className="hover:text-neon-cyan">
                      {product.name}
                    </Link>
                  </td>
                  <td className="p-4 font-body text-foreground/70">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => toggleStatus(product)}
                      className={`inline-block px-3 py-1 rounded-full text-xs font-display tracking-wider border transition-colors disabled:opacity-50 ${
                        product.status === 'active'
                          ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30 hover:bg-neon-cyan/20'
                          : 'bg-foreground/5 text-foreground/40 border-foreground/10 hover:bg-foreground/10'
                      }`}
                    >
                      {product.status.toUpperCase()}
                    </button>
                  </td>
                  <td className="p-4">
                    {product.mainPageDisplay ? (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-display tracking-wider bg-neon-purple/10 text-neon-purple border border-neon-purple/30">
                        &#9733; MAIN
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setAsMainPage(product)}
                        className="inline-block px-3 py-1 rounded-full text-xs font-display tracking-wider bg-foreground/5 text-foreground/50 border border-foreground/10 hover:bg-neon-purple/10 hover:text-neon-purple hover:border-neon-purple/30 transition-colors disabled:opacity-50"
                      >
                        Set Main
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/hq/products/${product.id}`}
                        className="text-sm text-neon-cyan/70 hover:text-neon-cyan font-body transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(product)}
                        className="text-sm text-neon-red/60 hover:text-neon-red font-body transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
