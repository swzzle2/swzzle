'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [tags, setTags] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
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

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  function handleTitleChange(value: string) {
    setTitle(value);
    setSlug(slugify(value));
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Write a blog post titled "${title}". Tags: ${tags || 'general'}. Write the post body only in markdown format. 3-5 paragraphs. Make it engaging and on-brand.`,
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
                setBody(text);
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch {
      setMessage('Failed to generate content');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(publishStatus?: 'draft' | 'published') {
    const finalStatus = publishStatus || status;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          body,
          status: finalStatus,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!res.ok) throw new Error('Save failed');

      setMessage('Post saved successfully');
      router.push('/hq/blog');
    } catch {
      setMessage('Failed to save post');
    } finally {
      setSaving(false);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/50 font-body">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/hq/blog"
            className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors"
          >
            &larr; Blog
          </Link>
          <h1 className="font-display text-2xl text-neon-cyan tracking-wider mt-2">
            NEW POST
          </h1>
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-display text-foreground/50 tracking-wider mb-2">
                TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="neon-input"
                placeholder="Post title"
              />
            </div>

            <div>
              <label className="block text-sm font-display text-foreground/50 tracking-wider mb-2">
                SLUG
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="neon-input"
                placeholder="auto-generated-from-title"
              />
            </div>

            <div>
              <label className="block text-sm font-display text-foreground/50 tracking-wider mb-2">
                TAGS
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="neon-input"
                placeholder="disc golf, recovery, athletes (comma separated)"
              />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-display text-foreground/50 tracking-wider">
                BODY
              </label>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !title}
                className="text-xs font-display tracking-wider text-neon-purple hover:text-neon-purple/80 border border-neon-purple/30 px-3 py-1 rounded transition-colors disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate with Grok'}
              </button>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              className="neon-input resize-y font-mono text-sm"
              placeholder="Write your post content in markdown..."
            />
          </div>

          <div className="bg-surface border border-border rounded-lg p-6">
            <label className="block text-sm font-display text-foreground/50 tracking-wider mb-3">
              STATUS
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`px-4 py-2 rounded-md font-display text-sm tracking-wider border transition-colors ${
                  status === 'draft'
                    ? 'bg-foreground/10 text-foreground border-foreground/30'
                    : 'bg-transparent text-foreground/30 border-foreground/10'
                }`}
              >
                DRAFT
              </button>
              <button
                type="button"
                onClick={() => setStatus('published')}
                className={`px-4 py-2 rounded-md font-display text-sm tracking-wider border transition-colors ${
                  status === 'published'
                    ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30'
                    : 'bg-transparent text-foreground/30 border-foreground/10'
                }`}
              >
                PUBLISHED
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving || !title}
              className="px-8 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-display text-sm tracking-widest uppercase rounded-md hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => handleSave('published')}
              disabled={saving || !title}
              className="px-8 py-3 bg-neon-purple/10 border border-neon-purple text-neon-purple font-display text-sm tracking-widest uppercase rounded-md hover:bg-neon-purple/20 transition-all disabled:opacity-50"
            >
              Publish
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
