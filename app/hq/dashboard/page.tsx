import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import { readData } from '@/lib/data-store';
import type { Product } from '@/lib/products';
import type { Post } from '@/lib/posts';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  if (!(await isAuthenticated())) {
    redirect('/hq/login');
  }

  const products = await readData<Product[]>('products.json');
  const posts = await readData<Post[]>('posts.json');
  const activeProducts = products.filter((p) => p.status === 'active').length;
  const publishedPosts = posts.filter((p) => p.status === 'published').length;

  const cards = [
    {
      label: 'Orders',
      value: '--',
      sub: 'View in Stripe or Orders tab',
      color: 'text-neon-cyan',
      borderColor: 'border-neon-cyan/30',
    },
    {
      label: 'Active Products',
      value: activeProducts,
      sub: `${products.length} total`,
      color: 'text-neon-red',
      borderColor: 'border-neon-red/30',
    },
    {
      label: 'Published Posts',
      value: publishedPosts,
      sub: `${posts.length} total`,
      color: 'text-neon-purple',
      borderColor: 'border-neon-purple/30',
    },
  ];

  const quickLinks = [
    { label: 'Products', href: '/hq/products', icon: '⬡' },
    { label: 'Blog', href: '/hq/blog', icon: '✎' },
    { label: 'Orders', href: '/hq/orders', icon: '◈' },
    { label: 'Settings', href: '/hq/settings', icon: '⚙' },
  ];

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl text-neon-cyan tracking-wider">
              SWZZLE HQ
            </h1>
            <p className="text-foreground/50 text-sm font-body mt-1">
              Command Center
            </p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-sm text-foreground/40 hover:text-neon-red font-body transition-colors"
            >
              Logout
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`bg-surface border ${card.borderColor} rounded-lg p-6`}
            >
              <p className="text-foreground/50 text-sm font-body mb-1">
                {card.label}
              </p>
              <p className={`font-display text-4xl ${card.color}`}>
                {card.value}
              </p>
              <p className="text-foreground/30 text-xs font-body mt-2">
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        <h2 className="font-display text-lg text-foreground/70 tracking-wider mb-4">
          QUICK LINKS
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-surface border border-border rounded-lg p-6 text-center hover:border-neon-cyan/40 transition-colors group"
            >
              <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform inline-block">
                {link.icon}
              </span>
              <span className="font-display text-sm tracking-wider text-foreground/70 group-hover:text-neon-cyan transition-colors">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
