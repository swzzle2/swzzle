import Link from 'next/link';
import { getPublishedPosts } from '@/lib/posts';

export const metadata = {
  title: 'Blog — Swzzle Liniment',
  description: 'Field notes, formulation updates, and stories from the course.',
};

export default function BlogIndex() {
  const posts = getPublishedPosts().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <section className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="font-display text-4xl md:text-5xl text-neon-cyan mb-2 tracking-wide">
        Blog
      </h1>
      <p className="font-body text-foreground/60 mb-12 text-lg">
        Field notes, formulation updates, and stories from the course.
      </p>

      {posts.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-foreground/40 text-xl font-body">
            No posts yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block bg-surface border border-border rounded-lg p-6 transition-all duration-300 hover:border-neon-cyan/40 hover:shadow-[0_0_30px_rgba(0,245,255,0.08)]"
            >
              <time className="text-xs text-foreground/40 font-body uppercase tracking-wider">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>

              <h2 className="font-display text-lg text-foreground mt-2 mb-3 group-hover:text-neon-cyan transition-colors">
                {post.title}
              </h2>

              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
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

              {post.excerpt && (
                <p className="text-sm text-foreground/50 font-body leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
