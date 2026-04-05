import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 rounded-full bg-neon-red/10 border border-neon-red/20 flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-neon-red"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-xl font-bold tracking-wide text-foreground">
            Authentication Error
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Something went wrong during sign in. Please try again.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/signin"
            className="inline-block border-2 border-neon-cyan text-neon-cyan font-display font-bold uppercase tracking-wider px-6 py-2.5 rounded hover:bg-neon-cyan/10 transition-all duration-300 text-sm"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-foreground transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
