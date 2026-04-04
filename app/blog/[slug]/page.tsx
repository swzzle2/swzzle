import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readData } from '@/lib/data-store';
import type { Post } from '@/lib/posts';

export const dynamic = 'force-dynamic';

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const posts = await readData<Post[]>('posts.json');
  const post = posts.find((p) => p.slug === params.slug && p.status === 'published');
  if (!post) notFound();

  const paragraphs = post.body.split('\n\n').filter(Boolean);

  return (
    <article className="max-w-3xl mx-auto px-4 py-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-neon-cyan/60 hover:text-neon-cyan font-body transition-colors mb-8"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Blog
      </Link>

      <header className="mb-10">
        <time className="text-xs text-foreground/40 font-body uppercase tracking-wider">
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mt-3 mb-4 leading-tight">
          {post.title}
        </h1>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-widest font-body px-2 py-0.5 rounded-full border border-neon-purple/30 text-neon-purple/70"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="border-t border-border pt-8 space-y-6">
        {paragraphs.map((paragraph, i) => (
          <p
            key={i}
            className="font-body text-foreground/80 leading-relaxed text-base"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
