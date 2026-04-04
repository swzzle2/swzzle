'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type Post = {
  id: string;
  title: string;
  slug: string;
  tags: string[];
  body: string;
  status: 'draft' | 'published';
  date: string;
  excerpt: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [tags, setTags] = useState('');
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

  const loadPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/posts?id=${postId}`);
      if (!res.ok) throw new Error('Post not found');
      const data = await res.json();
      setPost(data);
      setTags(data.tags?.join(', ') || '');
    } catch {
      setMessage('Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authed) loadPost();
  }, [authed, loadPost]);

  function updateField(field: keyof Post, value: string) {
    if (!post) return;
    setPost({ ...post, [field]: value });
  }

  function handleTitleChange(value: string) {
    if (!post) return;
    setPost({ ...post, title: value, slug: slugify(value) });
  }

  async function handleGenerate() {
    if (!post) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Write a blog post titled "${post.title}". Tags: ${tags || 'general'}. Write the post body only in markdown format. 3-5 paragraphs. Make it engaging and on-brand.`,
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
                setPost((prev) => (prev ? { ...prev, body: text } : prev));
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
    if (!post) return;
    const finalStatus = publishStatus || post.status;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...post,
          status: finalStatus,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error('Save failed');
      setMessage('Post saved successfully');
    } catch {
      setMessage('Failed to save post');
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

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-neon-red font-body">Post not found</p>
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
            EDIT POST
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
                value={post.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="neon-input"
              />
            </div>

            <div>
              <label className="block text-sm font-display text-foreground/50 tracking-wider mb-2">
                SLUG
              </label>
              <input
                type="text"
                value={post.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                className="neon-input"
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
                placeholder="disc golf, recovery, athletes"
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
                disabled={generating}
                className="text-xs font-display tracking-wider text-neon-purple hover:text-neon-purple/80 border border-neon-purple/30 px-3 py-1 rounded transition-colors disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate with Grok'}
              </button>
            </div>
            <textarea
              value={post.body}
              onChange={(e) => updateField('body', e.target.value)}
              rows={16}
              className="neon-input resize-y font-mono text-sm"
            />
          </div>

          <div className="bg-surface border border-border rounded-lg p-6">
            <label className="block text-sm font-display text-foreground/50 tracking-wider mb-3">
              STATUS
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => updateField('status', 'draft')}
                className={`px-4 py-2 rounded-md font-display text-sm tracking-wider border transition-colors ${
                  post.status === 'draft'
                    ? 'bg-foreground/10 text-foreground border-foreground/30'
                    : 'bg-transparent text-foreground/30 border-foreground/10'
                }`}
              >
                DRAFT
              </button>
              <button
                type="button"
                onClick={() => updateField('status', 'published')}
                className={`px-4 py-2 rounded-md font-display text-sm tracking-wider border transition-colors ${
                  post.status === 'published'
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
              disabled={saving}
              className="px-8 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-display text-sm tracking-widest uppercase rounded-md hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => handleSave('published')}
              disabled={saving}
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
