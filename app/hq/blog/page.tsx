import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import { readData } from '@/lib/data-store';
import type { Post } from '@/lib/posts';

export const dynamic = 'force-dynamic';

export default async function BlogAdminPage() {
  if (!(await isAuthenticated())) {
    redirect('/hq/login');
  }

  const posts = await readData<Post[]>('posts.json');

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/hq/dashboard"
              className="text-foreground/40 text-sm font-body hover:text-neon-cyan transition-colors"
            >
              &larr; Dashboard
            </Link>
            <h1 className="font-display text-2xl text-neon-cyan tracking-wider mt-2">
              BLOG POSTS
            </h1>
          </div>
          <Link
            href="/hq/blog/new"
            className="px-6 py-2.5 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-display text-sm tracking-widest uppercase rounded-md hover:bg-neon-cyan/20 transition-all"
          >
            New Post
          </Link>
        </div>

        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {posts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-foreground/40 font-body">No posts yet. Create your first post.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                    TITLE
                  </th>
                  <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                    SLUG
                  </th>
                  <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                    STATUS
                  </th>
                  <th className="text-left p-4 font-display text-xs tracking-wider text-foreground/50">
                    DATE
                  </th>
                  <th className="text-right p-4 font-display text-xs tracking-wider text-foreground/50">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-border/50 hover:bg-surface-light/30 transition-colors"
                  >
                    <td className="p-4 font-body text-foreground">
                      {post.title}
                    </td>
                    <td className="p-4 font-body text-foreground/50 text-sm">
                      {post.slug}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-display tracking-wider ${
                          post.status === 'published'
                            ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
                            : 'bg-foreground/5 text-foreground/40 border border-foreground/10'
                        }`}
                      >
                        {post.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 font-body text-foreground/50 text-sm">
                      {post.date}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/hq/blog/${post.id}`}
                        className="text-sm text-neon-cyan/70 hover:text-neon-cyan font-body transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
