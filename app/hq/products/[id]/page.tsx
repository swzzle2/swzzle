'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  images?: string[];
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
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [authed, setAuthed] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Ensure images array exists
      if (!data.images) data.images = [];
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

  function updateField(field: keyof Product, value: string | number | boolean | string[]) {
    if (!product) return;
    setProduct({ ...product, [field]: value });
  }

  // ── Image Upload ──────────────────────────────────────────────
  async function uploadFiles(files: FileList | File[]) {
    if (!product) return;
    setUploading(true);
    setMessage('');

    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `products/${product.id}`);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json();
          setMessage(err.error || 'Upload failed');
          continue;
        }
        const data = await res.json();
        newUrls.push(data.url);
      } catch {
        setMessage('Upload failed');
      }
    }

    if (newUrls.length > 0) {
      const currentImages = product.images || [];
      const updatedImages = [...currentImages, ...newUrls];

      // If no main image set, use the first upload
      const mainImage = product.image && !product.image.startsWith('/labels/')
        ? product.image
        : newUrls[0];

      setProduct({
        ...product,
        image: mainImage,
        images: updatedImages,
      });
      setMessage(`${newUrls.length} image(s) uploaded`);
    }

    setUploading(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      e.target.value = '';
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  function setAsMainImage(url: string) {
    if (!product) return;
    setProduct({ ...product, image: url });
    setMessage('Main image updated — save to apply');
  }

  async function deleteImage(url: string) {
    if (!product) return;

    // Remove from Vercel Blob (only for uploaded images, not local placeholders)
    if (url.startsWith('http')) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
      } catch {
        // Continue anyway — remove from product data
      }
    }

    const updatedImages = (product.images || []).filter((img) => img !== url);
    const mainImage = product.image === url
      ? (updatedImages[0] || '')
      : product.image;

    setProduct({ ...product, image: mainImage, images: updatedImages });
    setMessage('Image removed — save to apply');
  }

  function moveImage(index: number, direction: -1 | 1) {
    if (!product?.images) return;
    const arr = [...product.images];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= arr.length) return;
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    setProduct({ ...product, images: arr });
  }

  // ── Grok Generate ─────────────────────────────────────────────
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

  // ── Save ──────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────
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

  const allImages = product.images || [];

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
          {/* ═══ IMAGES SECTION ═══ */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <label className="block text-sm font-display text-foreground/50 tracking-wider mb-4">
              IMAGES
            </label>

            {/* Main image display */}
            {product.image && (
              <div className="mb-4">
                <p className="text-xs font-display text-neon-cyan/60 tracking-wider mb-2">MAIN IMAGE</p>
                <div className="relative w-48 h-48 border border-neon-cyan/30 rounded-lg overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {/* Gallery grid */}
            {allImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-display text-foreground/40 tracking-wider mb-2">
                  ALL IMAGES ({allImages.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allImages.map((url, i) => (
                    <div
                      key={url}
                      className={`relative group rounded-lg overflow-hidden border ${
                        url === product.image
                          ? 'border-neon-cyan ring-2 ring-neon-cyan/30'
                          : 'border-border'
                      }`}
                    >
                      <div className="relative w-full aspect-square">
                        <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover" />
                      </div>

                      {/* Overlay controls */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                        {url !== product.image && (
                          <button
                            onClick={() => setAsMainImage(url)}
                            className="text-[10px] font-display tracking-wider text-neon-cyan border border-neon-cyan/40 px-2 py-0.5 rounded hover:bg-neon-cyan/10 w-full"
                          >
                            SET MAIN
                          </button>
                        )}
                        {url === product.image && (
                          <span className="text-[10px] font-display tracking-wider text-neon-cyan">
                            &#9733; MAIN
                          </span>
                        )}
                        <div className="flex gap-1 w-full">
                          <button
                            onClick={() => moveImage(i, -1)}
                            disabled={i === 0}
                            className="flex-1 text-[10px] font-display text-foreground/60 border border-foreground/20 px-1 py-0.5 rounded hover:bg-foreground/10 disabled:opacity-30"
                          >
                            &larr;
                          </button>
                          <button
                            onClick={() => moveImage(i, 1)}
                            disabled={i === allImages.length - 1}
                            className="flex-1 text-[10px] font-display text-foreground/60 border border-foreground/20 px-1 py-0.5 rounded hover:bg-foreground/10 disabled:opacity-30"
                          >
                            &rarr;
                          </button>
                        </div>
                        <button
                          onClick={() => deleteImage(url)}
                          className="text-[10px] font-display tracking-wider text-neon-red border border-neon-red/40 px-2 py-0.5 rounded hover:bg-neon-red/10 w-full"
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-neon-cyan bg-neon-cyan/5'
                  : 'border-border hover:border-foreground/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              {uploading ? (
                <p className="text-neon-cyan font-display text-sm tracking-wider animate-pulse">
                  UPLOADING...
                </p>
              ) : (
                <>
                  <p className="text-foreground/50 font-body text-sm mb-1">
                    Drag &amp; drop images here, or click to browse
                  </p>
                  <p className="text-foreground/30 font-body text-xs">
                    JPEG, PNG, WebP, GIF — max 10MB each — upload as many as you want
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ═══ CORE FIELDS ═══ */}
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

          {/* ═══ PRODUCT DETAILS ═══ */}
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

          {/* ═══ ACTIONS ═══ */}
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
                  message.includes('success') || message.includes('uploaded') || message.includes('updated')
                    ? 'text-neon-cyan'
                    : message.includes('removed')
                    ? 'text-yellow-400'
                    : message.includes('Failed')
                    ? 'text-neon-red'
                    : 'text-foreground/50'
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
