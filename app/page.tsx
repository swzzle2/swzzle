import Image from 'next/image';
import { readData } from '@/lib/data-store';
import type { Product } from '@/lib/products';
import { AddToStickButton } from '@/components/AddToStickButton';
import { StarField } from '@/components/StarField';
import { HudBrackets } from '@/components/HudBrackets';
import { ContactFormStick } from '@/components/ContactFormStick';
import { EmailCapture } from '@/components/EmailCapture';

export const dynamic = 'force-dynamic';

const fullStack = [
  {
    category: 'CARRIERS',
    color: 'text-neon-cyan',
    borderColor: 'border-neon-cyan/30',
    glowColor: 'shadow-[0_0_20px_rgba(0,229,255,0.1)]',
    items: [
      { name: 'Fractionated Coconut Oil', detail: 'The getaway driver. Liquid at room temperature, invisible on skin, and already three layers deep by the time you remember to wash your hands.' },
      { name: 'Castor Oil', detail: "The frickin' delivery truck. Ricinoleic acid doesn't knock on the door. It moves in." },
      { name: "Apricot Kernel Oil", detail: "The only gentleman in the formula. Keeps everything gliding smooth so your application doesn't turn into a crime scene." },
      { name: 'Vitamin E Oil (Tocopherol)', detail: "So your skin doesn't file a formal complaint after the third application this week." },
    ],
  },
  {
    category: 'ACTIVES',
    color: 'text-neon-purple',
    borderColor: 'border-neon-purple/30',
    glowColor: 'shadow-[0_0_20px_rgba(182,0,255,0.1)]',
    items: [
      { name: 'Oil of Wintergreen', detail: "The headliner. Every other ingredient is opening for this one. Goes on clean, sinks in loud, and introduces itself to every nerve ending on the way down." },
      { name: 'Menthol Crystals', detail: "Hits first. Asks questions never. You'll know it's working approximately four seconds before you're ready for it." },
    ],
  },
  {
    category: 'BOOSTERS',
    color: 'text-foreground',
    borderColor: 'border-border',
    glowColor: '',
    items: [
      { name: 'Camphor Essential Oil', detail: 'Tells your blood vessels to get off the couch. They listen.' },
      { name: 'Eucalyptus Essential Oil', detail: 'The cool head in a very heated argument. Keeps the icy-hot-love-hate relationship balanced.' },
      { name: 'Peppermint Essential Oil', detail: 'The sharp one. Icy bite up front, slow burn behind it. Your nerve endings will have opinions.' },
      { name: 'Ginger Essential Oil', detail: 'Quiet warmth that builds in the background while everything else is making noise.' },
    ],
  },
  {
    category: 'THERMALS',
    color: 'text-neon-red',
    borderColor: 'border-neon-red/30',
    glowColor: 'shadow-[0_0_20px_rgba(255,32,32,0.1)]',
    items: [
      { name: 'Black Pepper Essential Oil', detail: "The bouncer at the door \u2014 makes sure the rest of the stack gets in and does its job." },
      { name: 'Cinnamon Bark Essential Oil', detail: "Surface heat on contact. The thermal trigger that tells the rest of the formula it's time to work." },
    ],
  },
];

export default async function HomePage() {
  const products = await readData<Product[]>('products.json');
  const product = products.find((p) => p.status === 'active') || products[0];

  return (
    <div className="relative min-h-screen bg-background text-foreground font-body overflow-x-hidden">
      {/* ===== HEADER IMAGE ===== */}
      <section className="relative w-full">
        <div className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden">
          <Image
            src="/header-image.png"
            alt="Swzzle Liniment Stick"
            fill
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* ===== 1. HERO ===== */}
      <section id="product" className="relative flex flex-col items-center justify-center px-4 py-16 md:py-24 overflow-hidden">
        <StarField />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Product image */}
          <div className="relative w-40 h-40 md:w-56 md:h-56 mb-8">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain drop-shadow-[0_0_40px_rgba(0,229,255,0.3)]"
              priority
            />
          </div>

          {/* Headline */}
          <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl tracking-wider mb-4 text-foreground drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">
            Upgrade the Hardware
          </h1>

          {/* Subhead */}
          <p className="font-display text-lg md:text-2xl text-gray-400 tracking-widest uppercase mb-10">
            Twist. Glide. Play Hard.
          </p>

          {/* CTA */}
          <AddToStickButton product={product} />
        </div>
      </section>

      {/* ===== 2. THE PITCH ===== */}
      <section className="relative px-4 py-20 md:py-32">
        <StarField />
        <div className="relative z-10 max-w-3xl mx-auto">
          <HudBrackets>
            <div className="space-y-6 text-gray-300 text-base md:text-lg leading-relaxed font-body">
              <p className="font-display text-neon-cyan text-xl md:text-2xl font-bold">
                Hey champ, your body called. It said, &ldquo;I&rsquo;m not built for this.&rdquo;
              </p>

              <p>
                Swzzle Liniment Stick is the savage reply that doesn&rsquo;t need a Drug Facts box or grandpa&rsquo;s permission slip.
              </p>

              <p>
                We run the Full Stack &mdash; oil of wintergreen, menthol, camphor, eucalyptus, ginger, black pepper, cinnamon bark, the whole crew your grandpa&rsquo;s jelly wishes it had. Stacked deliberately so every sensation hits without a single ingredient crossing the FDA&rsquo;s &ldquo;congratulations, you&rsquo;re now a drug dealer&rdquo; line.
              </p>

              <p>
                More sensation you can feel. Better glide. Way less risk of your gym bag turning into a crime scene.
              </p>

              <p>
                Zero mess. Zero jelly hands. Zero &ldquo;why is everything I own sticky&rdquo; drama. Twist, glide, and feel it build on your throwing arm, shoulders, or whatever you punished on the last round.
              </p>

              <p>
                No fillers you can&rsquo;t pronounce. No mystery fragrance that smells like broken dreams. Just the Full Stack and the sensation.
              </p>

              <p className="font-display text-neon-cyan font-bold">
                Swzzle Liniment Stick. Because your body&rsquo;s already plotting against you.
              </p>

              <p className="font-display text-foreground text-2xl md:text-3xl font-black tracking-wider pt-4 drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                Upgrade the Hardware.
              </p>
            </div>
          </HudBrackets>
        </div>
      </section>

      {/* ===== 3. HOW IT WORKS ===== */}
      <section className="px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-black text-3xl md:text-5xl text-center mb-16 tracking-wider">
            HOW IT WORKS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {/* Twist */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 mb-6 flex items-center justify-center">
                <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                  <circle cx="32" cy="32" r="28" stroke="#00F5FF" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />
                  <path d="M32 12 A20 20 0 0 1 52 32" stroke="#00F5FF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M50 28 L52 32 L48 33" stroke="#00F5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <circle cx="32" cy="32" r="4" fill="#00F5FF" opacity="0.8" />
                </svg>
              </div>
              <h3 className="font-display font-black text-2xl text-neon-cyan tracking-wider mb-3">Twist.</h3>
              <p className="text-gray-400">Pop the cap, twist up the stick.</p>
            </div>

            {/* Glide */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 mb-6 flex items-center justify-center">
                <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                  <path d="M12 44 C20 36, 32 28, 52 20" stroke="#00F5FF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M46 18 L52 20 L48 25" stroke="#00F5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <path d="M12 48 C20 40, 32 32, 52 24" stroke="#00F5FF" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.3" />
                  <path d="M12 52 C20 44, 32 36, 52 28" stroke="#00F5FF" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.15" />
                </svg>
              </div>
              <h3 className="font-display font-black text-2xl text-neon-cyan tracking-wider mb-3">Glide.</h3>
              <p className="text-gray-400">Run it over the throwing arm, shoulders, lower back &mdash; wherever the last round punished you.</p>
            </div>

            {/* Feel it build */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 mb-6 flex items-center justify-center">
                <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                  <path d="M8 32 Q16 20, 24 32 Q32 44, 40 32 Q48 20, 56 32" stroke="#00F5FF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M8 32 Q16 26, 24 32 Q32 38, 40 32 Q48 26, 56 32" stroke="#00F5FF" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.3" />
                  <circle cx="56" cy="32" r="3" fill="#00F5FF" opacity="0.8" />
                </svg>
              </div>
              <h3 className="font-display font-black text-2xl text-neon-cyan tracking-wider mb-3">Feel it build.</h3>
              <p className="text-gray-400">No mess. No jelly hands. No gym bag crime scene.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4. THE FULL STACK ===== */}
      <section className="relative px-4 py-20 md:py-28">
        {/* fullstack-artwork placeholder */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-full h-full border-2 border-dashed border-border/20 bg-surface/20 flex items-center justify-center">
            <span className="text-gray-700 font-display text-xs uppercase tracking-widest">fullstack-artwork</span>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <h2 className="font-display font-black text-3xl md:text-5xl text-center mb-4 tracking-wider">
            THE FULL STACK
          </h2>
          <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">
            Every ingredient earns its spot or gets cut. No filler. No fairy dust. Just function.
          </p>

          <div className="space-y-12">
            {fullStack.map((group) => (
              <div key={group.category}>
                <div className="flex items-center gap-3 mb-6">
                  <h3 className={`font-display font-black text-xl sm:text-2xl tracking-wider ${group.color}`}>
                    {group.category}
                  </h3>
                  <div className={`flex-1 h-px ${group.borderColor} border-t`} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <div
                      key={item.name}
                      className={`border ${group.borderColor} rounded-lg p-5 bg-surface hover:bg-surface-light transition-colors ${group.glowColor}`}
                    >
                      <h4 className={`font-display font-bold text-sm tracking-wider ${group.color} mb-2`}>
                        {item.name}
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5. WHY NOT THE JELLY ===== */}
      <section className="relative px-4 py-20 md:py-28">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-black text-3xl md:text-5xl text-center mb-16 tracking-wider">
            WHY NOT THE JELLY
          </h2>

          {/* comparison-artwork placeholder */}
          <div className="absolute top-4 right-4 w-32 h-32 border border-dashed border-border/30 bg-surface/20 flex items-center justify-center pointer-events-none">
            <span className="text-gray-700 font-display text-[8px] uppercase tracking-widest">comparison-artwork</span>
          </div>

          <div className="border border-border rounded-xl overflow-hidden bg-surface">
            {/* Header row */}
            <div className="grid grid-cols-3 border-b border-border">
              <div className="p-4 md:p-6" />
              <div className="p-4 md:p-6 border-l border-border text-center">
                <span className="font-display text-xs md:text-sm uppercase tracking-wider text-gray-500">The Jelly</span>
              </div>
              <div className="p-4 md:p-6 border-l border-neon-cyan/30 text-center bg-neon-cyan/[0.03]">
                <span className="font-display text-xs md:text-sm uppercase tracking-wider text-neon-cyan">Swzzle Liniment Stick</span>
              </div>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-3 border-b border-border">
              <div className="p-4 md:p-6 flex items-center">
                <span className="font-display text-xs uppercase tracking-wider text-gray-500">Mechanism</span>
              </div>
              <div className="p-4 md:p-6 border-l border-border flex items-center justify-center text-center">
                <span className="text-gray-500 text-sm">Single mechanism (menthol)</span>
              </div>
              <div className="p-4 md:p-6 border-l border-neon-cyan/30 flex items-center justify-center text-center bg-neon-cyan/[0.03]">
                <span className="text-neon-cyan text-sm font-medium">Full Stack sensation</span>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-3 border-b border-border">
              <div className="p-4 md:p-6 flex items-center">
                <span className="font-display text-xs uppercase tracking-wider text-gray-500">Application</span>
              </div>
              <div className="p-4 md:p-6 border-l border-border flex items-center justify-center text-center">
                <span className="text-gray-500 text-sm">Pump it into your palm</span>
              </div>
              <div className="p-4 md:p-6 border-l border-neon-cyan/30 flex items-center justify-center text-center bg-neon-cyan/[0.03]">
                <span className="text-neon-cyan text-sm font-medium">Twist-and-glide, zero mess</span>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-3">
              <div className="p-4 md:p-6 flex items-center">
                <span className="font-display text-xs uppercase tracking-wider text-gray-500">Absorption</span>
              </div>
              <div className="p-4 md:p-6 border-l border-border flex items-center justify-center text-center">
                <span className="text-gray-500 text-sm">Sits on top</span>
              </div>
              <div className="p-4 md:p-6 border-l border-neon-cyan/30 flex items-center justify-center text-center bg-neon-cyan/[0.03]">
                <span className="text-neon-cyan text-sm font-medium">Sinks in</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 6. TESTIMONIALS ===== */}
      <section className="px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-black text-2xl md:text-4xl text-center mb-12 tracking-wider">
            WHAT THEY&apos;RE SAYING
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Jim B */}
            <div className="border border-neon-cyan/20 rounded-xl p-6 bg-surface shadow-[0_0_20px_rgba(0,229,255,0.05)]">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-neon-cyan">&#9733;</span>
                ))}
              </div>
              <p className="text-gray-400 text-sm italic mb-4 leading-relaxed">
                &ldquo;Skeptical as hell. I&apos;m a Freeze guy for years. My buddy wouldn&apos;t shut up about this stuff, so I finally put some on before our Sunday round. I hate that it worked.&rdquo;
              </p>
              <p className="text-gray-600 text-xs font-display uppercase tracking-wider">
                &mdash; Jim B.
              </p>
            </div>

            {/* Rachel K */}
            <div className="border border-neon-cyan/20 rounded-xl p-6 bg-surface shadow-[0_0_20px_rgba(0,229,255,0.05)]">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-neon-cyan">&#9733;</span>
                ))}
              </div>
              <p className="text-gray-400 text-sm italic mb-4 leading-relaxed">
                {'{{ testimonial_rachel_rewrite }}'}
              </p>
              <p className="text-gray-600 text-xs font-display uppercase tracking-wider">
                &mdash; Rachel K.
              </p>
            </div>

            {/* Jeremy G */}
            <div className="border border-neon-cyan/20 rounded-xl p-6 bg-surface shadow-[0_0_20px_rgba(0,229,255,0.05)]">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-neon-cyan">&#9733;</span>
                ))}
              </div>
              <p className="text-gray-400 text-sm italic mb-4 leading-relaxed">
                &ldquo;I&apos;m 46. I play tournaments every month. My arm has been barking at me for a couple of years. I put Red on before my last league and shot fire. Correlation? Maybe. Am I ever playing without it again? Absolutely not.&rdquo;
              </p>
              <p className="text-gray-600 text-xs font-display uppercase tracking-wider">
                &mdash; Jeremy G.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 7. FOUNDER'S NOTE ===== */}
      <section className="px-4 py-20 md:py-28">
        <div className="max-w-3xl mx-auto">
          <details className="group border border-border rounded-xl bg-surface overflow-hidden">
            <summary className="cursor-pointer p-6 md:p-8 flex items-center justify-between hover:bg-surface-light transition-colors">
              <h2 className="font-display font-black text-xl md:text-2xl tracking-wider">
                WHY SWZZLE EXISTS
              </h2>
              <svg className="w-5 h-5 text-neon-cyan transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="px-6 pb-8 md:px-8 space-y-4 text-gray-400 text-sm md:text-base leading-relaxed border-t border-border pt-6">
              <p>
                I&apos;m Jeremy. I play disc golf &mdash; tournaments, leagues, casual rounds, all of it. I&apos;m 46. My arm started barking at me two years ago. Not injury-level stuff, just the kind of thing that builds when you throw 60+ shots in a round and play multiple times a week.
              </p>
              <p>
                I tried everything the big brands sell. Freeze sprays, roll-ons, gels, wraps. They all had the same thing in common: one active ingredient doing one thing, surrounded by filler, and packaged like it belongs in a nursing home.
              </p>
              <p>
                I started researching what actually creates sensation, what actually penetrates, what actually stacks. Not drugs. Not claims. Just ingredients that do something you can feel, delivered in a way that gets them where they need to go.
              </p>
              <p>
                Swzzle is what came out of that. A full-stack formula that hits multiple sensation pathways &mdash; warming, cooling, tingling &mdash; without crossing into drug territory. Built for athletes, not patients. In a stick format because nobody wants to pump gel into their hands at hole 9.
              </p>
              <p>
                I lost a tournament because my arm gave out on the back nine. That was the last time I played without this stuff. Now I make it so other people don&apos;t have to figure it out the hard way.
              </p>
              <p className="text-neon-cyan font-display font-bold">
                &mdash; Jeremy, Founder
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* ===== 8. TD PLAYER PACK ===== */}
      <section className="px-4 py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display font-black text-2xl md:text-4xl mb-4 tracking-wider">
            OUTFIT YOUR TOURNAMENT
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-10">
            MOQ 24 sticks. Wholesale pricing available for tournament directors.
          </p>
          <ContactFormStick />
        </div>
      </section>

      {/* ===== 9. EMAIL SIGNUP ===== */}
      <section className="px-4 py-20 md:py-28 border-t border-border">
        <div className="max-w-md mx-auto text-center">
          <h2 className="font-display font-black text-xl md:text-2xl mb-3 tracking-wider">
            STAY IN THE LOOP
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            New drops, tournament packs, and the occasional unhinged email.
          </p>
          <EmailCapture />
        </div>
      </section>

      {/* ===== 10. FINAL CTA ===== */}
      <section className="relative px-4 py-20 md:py-32 text-center">
        <StarField />
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="font-display font-black text-3xl md:text-5xl lg:text-6xl tracking-wider mb-8 drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">
            Upgrade the Hardware.
          </h2>
          <AddToStickButton product={product} />
        </div>
      </section>
    </div>
  );
}
