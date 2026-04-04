import { VitruvianMan } from '@/components/VitruvianMan';

export const metadata = {
  title: 'About — Swzzle Liniment',
  description:
    'The story behind Swzzle. Built from the same dirt we play on, in McConnelsville, Ohio.',
};

export default function AboutPage() {
  return (
    <section className="relative max-w-5xl mx-auto px-4 py-16 overflow-hidden">
      {/* Decorative background Vitruvian */}
      <div className="absolute top-12 right-0 opacity-10 pointer-events-none select-none hidden lg:block">
        <VitruvianMan color="#a855f7" size={500} />
      </div>

      <div className="relative z-10 max-w-2xl">
        <h1 className="font-display text-4xl md:text-5xl text-neon-cyan mb-3 tracking-wide">
          About Swzzle
        </h1>

        <p className="font-display text-sm uppercase tracking-[0.3em] text-neon-red/80 mb-16">
          Built From The Same Dirt We Play On
        </p>

        {/* Founder's Note */}
        <div className="relative mb-16">
          <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-neon-cyan/60 via-neon-purple/40 to-transparent" />
          <h2 className="font-display text-xs uppercase tracking-[0.25em] text-neon-purple/70 mb-6 pl-4">
            Founder&apos;s Note
          </h2>
          <blockquote className="pl-4 space-y-5">
            <p className="font-body text-foreground/80 text-lg leading-relaxed italic">
              &ldquo;I didn&apos;t start Swzzle because I saw a market opportunity. I started
              it because disc golf gave me something I didn&apos;t know I needed — the
              feeling of being genuinely alive. The tournament morning alarm that you
              want to hear. The quiet focus of a pre-round warmup. The way a stranger
              becomes a playing partner becomes a friend over eighteen holes.&rdquo;
            </p>
          </blockquote>
        </div>

        {/* Origin */}
        <div className="bg-surface border border-border rounded-lg p-8 mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full border border-neon-cyan/30 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-neon-cyan/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-display text-sm text-foreground tracking-wide">
                McConnelsville, Ohio
              </p>
              <p className="text-xs text-foreground/40 font-body">
                Where Swzzle is made
              </p>
            </div>
          </div>
          <p className="font-body text-foreground/60 leading-relaxed">
            Swzzle builds the simplest, most effective tools to turn any
            standard-issue human body into a high-performance machine. Every
            formulation is tested on the course, refined by hand, and shipped from
            a small town in southeast Ohio.
          </p>
        </div>

        {/* Inline small Vitruvian for mobile */}
        <div className="flex justify-center lg:hidden mb-16 opacity-20">
          <VitruvianMan color="#a855f7" size={200} />
        </div>

        {/* Mission */}
        <div className="text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-foreground/30 mb-3">
            Our Mission
          </p>
          <p className="font-body text-foreground/60 text-lg max-w-lg mx-auto leading-relaxed">
            Make it easier for people to feel good enough to do the things they
            love — starting with the athletes who play in the dirt.
          </p>
        </div>
      </div>
    </section>
  );
}
