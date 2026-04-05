import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <span className="font-display font-black text-2xl tracking-wider text-foreground">SWZZLE</span>
            <p className="text-gray-500 text-sm mt-2 font-body">
              Science Wins... You Can, Too!
            </p>
            <p className="text-gray-600 text-xs mt-1 font-body">
              McConnelsville, Ohio
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            <h4 className="font-display text-sm uppercase tracking-wider text-gray-400 mb-3">Shop</h4>
            <Link href="/products/red" className="block text-sm text-gray-500 hover:text-neon-red transition-colors">Swzzle Red</Link>
            <Link href="/products/blue" className="block text-sm text-gray-500 hover:text-neon-cyan transition-colors">Swzzle Blue</Link>
            <Link href="/products/bundle" className="block text-sm text-gray-500 hover:text-foreground transition-colors">Bundle</Link>
          </div>

          {/* Links */}
          <div className="space-y-2">
            <h4 className="font-display text-sm uppercase tracking-wider text-gray-400 mb-3">Company</h4>
            <Link href="/about" className="block text-sm text-gray-500 hover:text-foreground transition-colors">About</Link>
            <Link href="/blog" className="block text-sm text-gray-500 hover:text-foreground transition-colors">Blog</Link>
            <Link href="/cart" className="block text-sm text-gray-500 hover:text-foreground transition-colors">Cart</Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-xs font-body">
            swzzle.com &copy; {new Date().getFullYear()} Swzzle Liniment
          </p>
          <Link
            href="/hq"
            className="text-xs text-gray-700 hover:text-gray-500 transition-colors font-body"
          >
            Powered By Swzzle
          </Link>
        </div>
      </div>
    </footer>
  );
}
