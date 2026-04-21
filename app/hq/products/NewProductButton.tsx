'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NewProductButton() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    const name = window.prompt('New product name:');
    if (!name) return;

    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Create failed');
      }
      const data = await res.json();
      router.push(`/hq/products/${data.product.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleCreate}
        disabled={creating}
        className="px-5 py-2.5 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-display text-sm tracking-wider uppercase rounded-md hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
      >
        {creating ? 'Creating…' : '+ New Product'}
      </button>
      {error && <p className="text-neon-red text-xs font-body">{error}</p>}
    </div>
  );
}
