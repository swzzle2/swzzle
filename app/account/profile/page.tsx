'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { Address, Customer } from '@/lib/customers';
import type { User } from '@supabase/supabase-js';

const EMPTY_ADDRESS: Address = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Address>({ ...EMPTY_ADDRESS });
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/customer/profile');
        if (res.ok) {
          const data = await res.json();
          setCustomer(data.customer);
          setName(data.customer.name);
          setAddresses(data.customer.addresses);
        }
      } catch {
        // will show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, addresses }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setCustomer(data.customer);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  function addAddress() {
    if (!newAddress.name || !newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.zip) {
      setMessage({ type: 'error', text: 'Please fill in all required address fields.' });
      return;
    }
    setAddresses([...addresses, { ...newAddress }]);
    setNewAddress({ ...EMPTY_ADDRESS });
    setShowAddressForm(false);
    setMessage(null);
  }

  function removeAddress(index: number) {
    setAddresses(addresses.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-bold tracking-wide">Profile</h1>

      {message && (
        <div
          className={`rounded-lg p-4 text-sm border ${
            message.type === 'success'
              ? 'bg-green-400/10 border-green-400/20 text-green-400'
              : 'bg-neon-red/10 border-neon-red/20 text-neon-red'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Basic info */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-gray-400">
          Basic Information
        </h2>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-body">Email</label>
          <div className="bg-background border border-border rounded px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed">
            {user?.email ?? customer?.email ?? ''}
          </div>
          <p className="text-xs text-gray-600 mt-1">Email is linked to your account and cannot be changed.</p>
        </div>

        <div>
          <label htmlFor="name" className="block text-xs text-gray-500 mb-1.5 font-body">
            Display Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-background border border-border rounded px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors"
            placeholder="Your name"
          />
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm uppercase tracking-wider text-gray-400">
            Saved Addresses
          </h2>
          {!showAddressForm && (
            <button
              onClick={() => setShowAddressForm(true)}
              className="text-xs text-neon-cyan hover:underline font-display uppercase tracking-wider"
            >
              + Add Address
            </button>
          )}
        </div>

        {addresses.length === 0 && !showAddressForm && (
          <p className="text-sm text-gray-600">No saved addresses yet.</p>
        )}

        {addresses.map((addr, i) => (
          <div key={i} className="flex items-start justify-between bg-background border border-border rounded-lg p-4">
            <div className="text-sm space-y-0.5">
              <p className="text-foreground font-medium">{addr.name}</p>
              <p className="text-gray-400">{addr.line1}</p>
              {addr.line2 && <p className="text-gray-400">{addr.line2}</p>}
              <p className="text-gray-400">
                {addr.city}, {addr.state} {addr.zip}
              </p>
              <p className="text-gray-500 text-xs">{addr.country}</p>
            </div>
            <button
              onClick={() => removeAddress(i)}
              className="text-gray-600 hover:text-neon-red transition-colors p-1"
              aria-label="Remove address"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        ))}

        {showAddressForm && (
          <div className="bg-background border border-neon-cyan/20 rounded-lg p-4 space-y-3">
            <p className="font-display text-xs uppercase tracking-wider text-neon-cyan mb-2">New Address</p>
            <input
              type="text"
              placeholder="Full name *"
              value={newAddress.name}
              onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors"
            />
            <input
              type="text"
              placeholder="Address line 1 *"
              value={newAddress.line1}
              onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors"
            />
            <input
              type="text"
              placeholder="Address line 2 (optional)"
              value={newAddress.line2 ?? ''}
              onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="City *"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="col-span-2 sm:col-span-1 bg-surface border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors"
              />
              <input
                type="text"
                placeholder="State *"
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                className="bg-surface border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors"
              />
              <input
                type="text"
                placeholder="ZIP *"
                value={newAddress.zip}
                onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                className="bg-surface border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors"
              />
              <input
                type="text"
                placeholder="Country"
                value={newAddress.country}
                onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                className="col-span-2 sm:col-span-1 bg-surface border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-neon-cyan/50 transition-colors"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={addAddress}
                className="border border-neon-cyan text-neon-cyan font-display text-xs uppercase tracking-wider px-4 py-2 rounded hover:bg-neon-cyan/10 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddressForm(false);
                  setNewAddress({ ...EMPTY_ADDRESS });
                }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="border-2 border-neon-cyan text-neon-cyan font-display font-bold uppercase tracking-wider px-8 py-3 rounded hover:bg-neon-cyan/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
