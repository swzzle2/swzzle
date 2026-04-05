'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type PromotionCode = {
  id: string;
  code: string;
  active: boolean;
  times_redeemed: number;
  max_redemptions: number | null;
  expires_at: number | null;
  coupon: {
    id: string;
    percent_off: number | null;
    amount_off: number | null;
    currency: string | null;
  };
};

export default function CouponsPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<PromotionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [codeName, setCodeName] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const checkAuth = useCallback(async () => {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) {
      router.push('/hq/login');
      return;
    }
    setAuthed(true);
  }, [router]);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/coupons');
      if (!res.ok) throw new Error('Failed to fetch coupons');
      const data = await res.json();
      setPromos(data.promotionCodes);
    } catch {
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authed) loadCoupons();
  }, [authed, loadCoupons]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const body: Record<string, unknown> = { name: codeName };
      if (discountType === 'percent') {
        body.percentOff = Number(discountValue);
      } else {
        body.amountOff = Number(discountValue);
        body.currency = 'usd';
      }
      if (maxRedemptions) body.maxRedemptions = Number(maxRedemptions);
      if (expiresAt) body.expiresAt = expiresAt;

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create coupon');
      }

      setSuccess(`Coupon ${codeName.toUpperCase()} created successfully`);
      setCodeName('');
      setDiscountValue('');
      setMaxRedemptions('');
      setExpiresAt('');
      setShowCreate(false);
      loadCoupons();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create coupon');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this coupon? Customers will no longer be able to use it.')) return;

    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: false }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to deactivate coupon');
      }

      setSuccess('Coupon deactivated');
      loadCoupons();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate');
    }
  }

  function formatDiscount(promo: PromotionCode): string {
    if (promo.coupon.percent_off) {
      return `${promo.coupon.percent_off}% off`;
    }
    if (promo.coupon.amount_off) {
      return `$${(promo.coupon.amount_off / 100).toFixed(2)} off`;
    }
    return 'N/A';
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/50 font-body">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/hq/dashboard"
              className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors"
            >
              &larr; Dashboard
            </Link>
            <h1 className="font-display text-2xl text-neon-cyan tracking-wider mt-2">
              COUPONS
            </h1>
            <p className="text-foreground/40 text-sm font-body mt-1">
              Manage Stripe promotion codes
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="px-6 py-2.5 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-display text-sm tracking-widest uppercase rounded-md hover:bg-neon-cyan/20 transition-all"
          >
            {showCreate ? 'CANCEL' : 'CREATE NEW COUPON'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-neon-red/10 border border-neon-red/30 rounded-lg p-4 mb-6">
            <p className="text-neon-red text-sm font-body">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
            <p className="text-green-400 text-sm font-body">{success}</p>
          </div>
        )}

        {/* Create Form */}
        {showCreate && (
          <div className="bg-surface border border-neon-cyan/20 rounded-lg p-6 mb-6">
            <h2 className="font-display text-sm tracking-wider text-neon-cyan/70 mb-6">
              CREATE NEW COUPON
            </h2>
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Code Name */}
                <div>
                  <label className="block text-foreground/40 text-xs font-body mb-2">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    value={codeName}
                    onChange={(e) => setCodeName(e.target.value)}
                    placeholder="e.g. SUMMER25"
                    required
                    className="neon-input w-full uppercase"
                  />
                  <p className="text-foreground/30 text-xs font-body mt-1">
                    Will be converted to uppercase
                  </p>
                </div>

                {/* Discount Type Toggle */}
                <div>
                  <label className="block text-foreground/40 text-xs font-body mb-2">
                    Discount Type
                  </label>
                  <div className="flex rounded-md overflow-hidden border border-border">
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`flex-1 py-2.5 text-sm font-display tracking-wider transition-all ${
                        discountType === 'percent'
                          ? 'bg-neon-cyan/20 text-neon-cyan border-r border-neon-cyan/30'
                          : 'bg-surface text-foreground/40 border-r border-border hover:text-foreground/60'
                      }`}
                    >
                      PERCENTAGE
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`flex-1 py-2.5 text-sm font-display tracking-wider transition-all ${
                        discountType === 'fixed'
                          ? 'bg-neon-cyan/20 text-neon-cyan'
                          : 'bg-surface text-foreground/40 hover:text-foreground/60'
                      }`}
                    >
                      FIXED AMOUNT
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-foreground/40 text-xs font-body mb-2">
                    {discountType === 'percent' ? 'Percentage Off' : 'Amount Off (USD)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30">
                      {discountType === 'percent' ? '%' : '$'}
                    </span>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === 'percent' ? '25' : '10.00'}
                      required
                      min="0"
                      max={discountType === 'percent' ? '100' : undefined}
                      step={discountType === 'percent' ? '1' : '0.01'}
                      className="neon-input w-full pl-8"
                    />
                  </div>
                </div>

                {/* Max Redemptions */}
                <div>
                  <label className="block text-foreground/40 text-xs font-body mb-2">
                    Max Redemptions (optional)
                  </label>
                  <input
                    type="number"
                    value={maxRedemptions}
                    onChange={(e) => setMaxRedemptions(e.target.value)}
                    placeholder="Unlimited"
                    min="1"
                    className="neon-input w-full"
                  />
                </div>

                {/* Expiration Date */}
                <div className="md:col-span-2">
                  <label className="block text-foreground/40 text-xs font-body mb-2">
                    Expiration Date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="neon-input w-full"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={creating || !codeName || !discountValue}
                  className="px-8 py-2.5 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-display text-sm tracking-widest uppercase rounded-md hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
                >
                  {creating ? 'CREATING...' : 'CREATE COUPON'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons Table */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-foreground/40 font-body">Loading coupons...</p>
            </div>
          ) : promos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-foreground/40 font-body">No coupons found. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['CODE', 'DISCOUNT', 'MAX USES', 'TIMES USED', 'EXPIRES', 'STATUS', 'ACTIONS'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left p-4 font-display text-xs tracking-wider text-foreground/50"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {promos.map((promo) => (
                    <tr
                      key={promo.id}
                      className={`border-b border-border/50 transition-colors ${
                        promo.active
                          ? 'hover:bg-surface-light/30'
                          : 'opacity-50'
                      }`}
                    >
                      <td className="p-4 font-display text-sm tracking-wider text-foreground">
                        {promo.code}
                      </td>
                      <td className="p-4 font-body text-foreground/70 text-sm">
                        {formatDiscount(promo)}
                      </td>
                      <td className="p-4 font-body text-foreground/50 text-sm">
                        {promo.max_redemptions ?? 'Unlimited'}
                      </td>
                      <td className="p-4 font-body text-foreground/50 text-sm">
                        {promo.times_redeemed}
                      </td>
                      <td className="p-4 font-body text-foreground/50 text-sm whitespace-nowrap">
                        {promo.expires_at
                          ? new Date(promo.expires_at * 1000).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-display tracking-wider border ${
                            promo.active
                              ? 'bg-green-500/10 text-green-400 border-green-500/30'
                              : 'bg-foreground/5 text-foreground/30 border-foreground/10'
                          }`}
                        >
                          {promo.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-4">
                        {promo.active ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(promo.id)}
                            className="text-xs font-display tracking-wider text-neon-red/60 hover:text-neon-red transition-colors"
                          >
                            DEACTIVATE
                          </button>
                        ) : (
                          <span className="text-xs font-body text-foreground/20">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
