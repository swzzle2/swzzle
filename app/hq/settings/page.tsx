'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Settings = {
  freeShippingThreshold: number;
  announcementBar: {
    active: boolean;
    text: string;
  };
};

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
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

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setSettings(data);
    } catch {
      setSettingsMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authed) loadSettings();
  }, [authed, loadSettings]);

  async function handleSaveSettings() {
    if (!settings) return;
    setSaving(true);
    setSettingsMessage('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Save failed');
      setSettingsMessage('Settings saved successfully');
    } catch {
      setSettingsMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword) return;
    setPasswordMessage('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      setPasswordMessage(data.message);
      setNewPassword('');
    } catch {
      setPasswordMessage('Failed to change password');
    }
  }

  if (!authed || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/50 font-body">Loading...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-neon-red font-body">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/hq/dashboard"
            className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors"
          >
            &larr; Dashboard
          </Link>
          <h1 className="font-display text-2xl text-neon-cyan tracking-wider mt-2">
            SETTINGS
          </h1>
        </div>

        <div className="space-y-8">
          {/* Store Settings */}
          <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
            <h2 className="font-display text-lg text-foreground/70 tracking-wider">
              STORE
            </h2>

            <div>
              <label className="block text-sm font-display text-foreground/50 tracking-wider mb-2">
                FREE SHIPPING THRESHOLD ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.freeShippingThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    freeShippingThreshold: parseFloat(e.target.value) || 0,
                  })
                }
                className="neon-input max-w-xs"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="block text-sm font-display text-foreground/50 tracking-wider">
                  ANNOUNCEMENT BAR
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      announcementBar: {
                        ...settings.announcementBar,
                        active: !settings.announcementBar.active,
                      },
                    })
                  }
                  className={`px-3 py-1 rounded-md font-display text-xs tracking-wider border transition-colors ${
                    settings.announcementBar.active
                      ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30'
                      : 'bg-foreground/5 text-foreground/40 border-foreground/10'
                  }`}
                >
                  {settings.announcementBar.active ? 'ON' : 'OFF'}
                </button>
              </div>
              <input
                type="text"
                value={settings.announcementBar.text}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcementBar: {
                      ...settings.announcementBar,
                      text: e.target.value,
                    },
                  })
                }
                className="neon-input"
                placeholder="Announcement text..."
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-8 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-display text-sm tracking-widest uppercase rounded-md hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              {settingsMessage && (
                <p
                  className={`text-sm font-body ${
                    settingsMessage.includes('success')
                      ? 'text-neon-cyan'
                      : 'text-neon-red'
                  }`}
                >
                  {settingsMessage}
                </p>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <h2 className="font-display text-lg text-foreground/70 tracking-wider">
              ADMIN PASSWORD
            </h2>

            <div>
              <label className="block text-sm font-display text-foreground/50 tracking-wider mb-2">
                NEW PASSWORD
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="neon-input max-w-md"
                placeholder="Enter new password"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={!newPassword}
                className="px-6 py-2.5 bg-neon-red/10 border border-neon-red text-neon-red font-display text-sm tracking-widest uppercase rounded-md hover:bg-neon-red/20 transition-all disabled:opacity-50"
              >
                Change Password
              </button>
              {passwordMessage && (
                <p className="text-sm font-body text-foreground/70">
                  {passwordMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
