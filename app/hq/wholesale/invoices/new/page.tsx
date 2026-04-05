'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Product = {
  id: string;
  name: string;
  price: number;
  stripePriceId?: string;
};

type LineItemRow = {
  key: string;
  mode: 'product' | 'custom';
  productId: string;
  name: string;
  quantity: number;
  unitPrice: string; // dollars as string for input
};

function emptyRow(): LineItemRow {
  return {
    key: Math.random().toString(36).slice(2, 9),
    mode: 'custom',
    productId: '',
    name: '',
    quantity: 1,
    unitPrice: '',
  };
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [items, setItems] = useState<LineItemRow[]>([emptyRow()]);
  const [shippingCost, setShippingCost] = useState('0');
  const [memo, setMemo] = useState('');
  const [daysUntilDue, setDaysUntilDue] = useState(30);

  const checkAuth = useCallback(async () => {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) router.push('/hq/login');
  }, [router]);

  useEffect(() => {
    checkAuth();
    fetchProducts();
  }, [checkAuth]);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  function updateItem(index: number, updates: Partial<LineItemRow>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  function handleProductSelect(index: number, productId: string) {
    if (productId === '') {
      updateItem(index, { mode: 'custom', productId: '', name: '', unitPrice: '' });
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product) {
      updateItem(index, {
        mode: 'product',
        productId: product.id,
        name: product.name,
        unitPrice: product.price.toFixed(2),
      });
    }
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyRow()]);
  }

  async function handleSubmit() {
    setError('');

    if (!customerName.trim() || !customerEmail.trim() || !companyName.trim()) {
      setError('Customer name, email, and company are required.');
      return;
    }

    const validItems = items.filter((item) => item.name.trim() && parseFloat(item.unitPrice) > 0);
    if (validItems.length === 0) {
      setError('At least one line item with a name and price is required.');
      return;
    }

    setSubmitting(true);

    try {
      const body = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        companyName: companyName.trim(),
        items: validItems.map((item) => ({
          productId: item.productId || undefined,
          name: item.name.trim(),
          quantity: item.quantity,
          unitPrice: Math.round(parseFloat(item.unitPrice) * 100), // dollars to cents
        })),
        shippingCost: Math.round(parseFloat(shippingCost || '0') * 100), // dollars to cents
        memo: memo.trim() || undefined,
        daysUntilDue,
      };

      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create invoice');
      }

      const invoice = await res.json();
      // Small delay to let Blob write propagate before redirect
      await new Promise((r) => setTimeout(r, 1500));
      router.push(`/hq/wholesale/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  }

  // Calculate totals for preview
  const subtotalCents = items.reduce((sum, item) => {
    const price = parseFloat(item.unitPrice) || 0;
    return sum + price * item.quantity * 100;
  }, 0);
  const shippingCents = Math.round(parseFloat(shippingCost || '0') * 100);
  const totalCents = subtotalCents + shippingCents;

  function formatCurrency(cents: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/hq/wholesale/invoices"
            className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors"
          >
            &larr; Invoices
          </Link>
          <h1 className="font-display text-2xl text-neon-cyan tracking-wider mt-2">
            CREATE INVOICE
          </h1>
        </div>

        {error && (
          <div className="bg-neon-red/10 border border-neon-red/30 rounded-lg p-4 mb-6">
            <p className="text-neon-red font-body text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="font-display text-sm uppercase tracking-wider text-foreground/60 mb-4">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-display tracking-wider text-foreground/50 mb-1.5">
                  CUSTOMER NAME
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="neon-input w-full"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-display tracking-wider text-foreground/50 mb-1.5">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="neon-input w-full"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-display tracking-wider text-foreground/50 mb-1.5">
                  COMPANY / ORG NAME
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="neon-input w-full"
                  placeholder="Acme Corp"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="font-display text-sm uppercase tracking-wider text-foreground/60 mb-4">
              Line Items
            </h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.key} className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-display tracking-wider text-foreground/50 mb-1.5">
                      PRODUCT
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className="neon-input w-full"
                    >
                      <option value="">Custom item...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.price.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-display tracking-wider text-foreground/50 mb-1.5">
                      NAME
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, { name: e.target.value })}
                      className="neon-input w-full"
                      placeholder="Item description"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-display tracking-wider text-foreground/50 mb-1.5">
                      QTY
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                      className="neon-input w-full"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-display tracking-wider text-foreground/50 mb-1.5">
                      UNIT PRICE ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                      className="neon-input w-full"
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                    className="px-3 py-2 text-neon-red/70 hover:text-neon-red hover:bg-neon-red/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove item"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-4 text-sm font-display text-neon-cyan/70 hover:text-neon-cyan tracking-wider transition-colors"
            >
              + Add Line Item
            </button>
          </div>

          {/* Shipping, Memo, Due Date */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="font-display text-sm uppercase tracking-wider text-foreground/60 mb-4">
              Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-display tracking-wider text-foreground/50 mb-1.5">
                  SHIPPING COST ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="neon-input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-display tracking-wider text-foreground/50 mb-1.5">
                  DAYS UNTIL DUE
                </label>
                <input
                  type="number"
                  min={1}
                  value={daysUntilDue}
                  onChange={(e) => setDaysUntilDue(parseInt(e.target.value) || 30)}
                  className="neon-input w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-display tracking-wider text-foreground/50 mb-1.5">
                MEMO / NOTES
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                className="neon-input w-full resize-none"
                placeholder="Optional notes for the customer..."
              />
            </div>
          </div>

          {/* Totals Preview */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between font-body text-sm text-foreground/60">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(subtotalCents)}</span>
                </div>
                {shippingCents > 0 && (
                  <div className="flex justify-between font-body text-sm text-foreground/60">
                    <span>Shipping</span>
                    <span className="font-mono">{formatCurrency(shippingCents)}</span>
                  </div>
                )}
                <div className="flex justify-between font-body text-base text-neon-cyan border-t border-border pt-2">
                  <span className="font-display tracking-wider text-sm">TOTAL</span>
                  <span className="font-mono font-bold">{formatCurrency(totalCents)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              href="/hq/wholesale/invoices"
              className="border border-border text-foreground/50 font-display text-xs uppercase tracking-wider px-6 py-3 rounded hover:border-foreground/30 hover:text-foreground/70 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-display text-xs uppercase tracking-wider px-6 py-3 rounded hover:bg-neon-cyan/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Save as Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
