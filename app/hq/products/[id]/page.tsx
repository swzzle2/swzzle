'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type Product = {
  id: string;
  name: string;
  descriptor: string;
  price: number;
  status: 'active' | 'inactive';
  shortDescription: string;
  longDescription: string;
  ingredients: string;
  directions: string;
  warnings: string;
  image: string;
  color: string;
};

export default function ProductEditorPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [authed, setAuthed] = useState(false);

  const checkAuth = useCallback(async () => {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) {
      router.push('/hq/login');
      return;
    }
    setAuthed(true);
  }, [router]);

  const loadProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/products?id=${productId}`);
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      setProduct(data);
    } catch {
      setMessage('Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authed) loadProduct();
  }, [authed, loadProduct]);

  function updateField(field: keyof Product, value: string | number | boolean) {
    if (!product) return;
    setProduct({ ...product, [field]: value });
  }

  async function handleGenerateDescription() {
    if (!product) return;
    setGenerating(true);

    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Write a compelling product description for "${product.name}" (${product.descriptor}). Ingredients: ${product.ingredients}. Directions: ${product.directions}. Short description: ${product.shortDescription}. Write the long description only, 2-3 paragraphs.`,
        }),
      });

      if (!res.ok) throw new Error('Grok request failed');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') continue;
            try {
              const parsed = JSON.parse(payload);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                text += content;
                updateField('longDescription', text);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      setProduct((prev) => prev ? { ...prev, longDescription: text } : prev);
    } catch {
      setMessage('Failed to generate description');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!product) return;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      if (!res.ok) throw new Error('Save failed');
      setMessage('Product saved successfully');
    } catch {
      setMessage('Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/50 font-body">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-neon-red font-body">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/hq/products"
            className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors"
          >
            &larr; Products
          </Link>
          <h1 className="font-display text-2xl text-neon-cyan tracking-wider mt-2">
            EDIT PRODUCT
          </h1>
        </div>

        <div className="space-y-6">
          {/* Image */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <label className="block text-sm font-display text-foreground/50 tracking-wider mb-3">
              IMAGE
            </label>
            {product.image && (
              <div className="relative w-48 h-48 mb-3">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain rounded"
                />
              </div>
            )}
            <p className="text-foreground/30 text-xs font-body">
              {'// TODO: wire image upload'}
            </p>
          </div>

          {/* Core fields */}
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-display text-foreground/50 tracking-wider mb-2">
                NAME
              </label>
              <input
                type="text"
                value={product.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="neon-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-display text-foreground/50 tracking-wider mb-2">
                  PRICE
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={product.price}
                  onChange={(e) =>
                    updateField('price', parseFloat(e.target.value) || 0)
                  }
                  className="neon-input"
                />
              </div>
              <div>
                <label className="block text-sm font-display text-foreground/50 tracking-wider mb-2">
                  STATUS
                </label>
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      'status',
                      product.status === 'active' ? 'inactive' : 'active'
                    )
                  }
                  className={`px-4 py-2.5 rounded-md font-display text-sm tracking-wider border transition-colors ${
                    product.status === 'active'
                      ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30'
                      : 'bg-foreground/5 text-foreground/40 border-foreground/10'
                  }`}
                >
                  {product.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-display text-foreground/50 tracking-wider mb-2">
                SHORT DESCRIPTION
              </label>
              <textarea
                value={product.shortDescription}
                onChange={(e) => updateField('shortDescription', e.target.value)}
                rows={3}
                className="neon-input resize-y"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-display text-foreground/50 tracking-wider">
                  LONG DESCRIPTION
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={generating}
                  className="text-xs font-display tracking-wider text-neon-purple hover:text-neon-purple/80 border border-neon-purple/30 px-3 py-1 rounded transition-colors disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate with Grok'}
                </button>
              </div>
              <textarea
                value={product.longDescription}
                onChange={(e) => updateField('longDescription', e.target.value)}
                rows={8}
                className="neon-input resize-y"
              />
            </div>
          </div>

          {/* Product details */}
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-display text-foreground/50 tracking-wider mb-2">
                INGREDIENTS
              </label>
              <textarea
                value={product.ingredients}
                onChange={(e) => updateField('ingredients', e.target.value)}
                rows={4}
                className="neon-input resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-display text-foreground/50 tracking-wider mb-2">
                DIRECTIONS
              </label>
              <textarea
                value={product.directions}
                onChange={(e) => updateField('directions', e.target.value)}
                rows={4}
                className="neon-input resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-display text-foreground/50 tracking-wider mb-2">
                WARNINGS
              </label>
              <textarea
                value={product.warnings}
                onChange={(e) => updateField('warnings', e.target.value)}
                rows={3}
                className="neon-input resize-y"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-display text-sm tracking-widest uppercase rounded-md hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Product'}
            </button>

            {message && (
              <p
                className={`text-sm font-body ${
                  message.includes('success')
                    ? 'text-neon-cyan'
                    : 'text-neon-red'
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
