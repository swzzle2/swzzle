import Link from 'next/link';
import Image from 'next/image';
import { readData } from '@/lib/data-store';
import type { Product } from '@/lib/products';
import { ContactForm } from '@/components/ContactForm';

export const dynamic = 'force-dynamic';

const fullStack = [
  {
    category: 'Carriers',
    color: 'text-neon-cyan',
    borderColor: 'border-neon-cyan/30',
    items: [
      { name: 'Fractionated Coconut Oil', detail: 'The getaway driver. Liquid at room temperature, invisible on skin, and already three layers deep by the time you remember to wash your hands.' },
      { name: 'Castor Oil', detail: 'The frickin\' delivery truck. Ricinoleic acid doesn\'t knock on the door. It moves in.' },
      { name: 'Apricot Kernel Oil', detail: 'The only gentleman in the formula. Keeps everything gliding smooth so your application doesn\'t turn into a crime scene.' },
    ],
  },
  {
    category: 'Actives',
    color: 'text-neon-purple',
    borderColor: 'border-neon-purple/30',
    items: [
      { name: 'Menthol Crystals', detail: 'Hits first. Asks questions never. You\'ll know it\'s working approximately four seconds before you\'re ready for it.' },
      { name: 'Turmeric CO2 Extract', detail: 'Curcumin so concentrated it would embarrass your smoothie. The one that actually showed up to work.' },
      { name: 'Vitamin E Oil (Tocopherol)', detail: 'So your skin doesn\'t file a formal complaint after the third application this week.' },
    ],
  },
  {
    category: 'Boosters',
    color: 'text-foreground',
    borderColor: 'border-border',
    items: [
      { name: 'Camphor Essential Oil', detail: 'Tells your blood vessels to get off the couch. They listen.' },
      { name: 'Eucalyptus Essential Oil', detail: 'The cool head in a very heated argument. Keeps the icy-hot-love-hate relationship balanced.' },
      { name: 'Black Pepper Essential Oil', detail: 'Piperine. The bouncer that gets curcumin past the velvet rope and into the club.' },
      { name: 'Peppermint Essential Oil', detail: 'The sharp one. Icy bite up front, slow burn behind it. Your nerve endings will have opinions.' },
      { name: 'Ginger Essential Oil', detail: 'Quiet warmth that builds in the background while everything else is making noise.' },
      { name: 'Rosemary Essential Oil', detail: 'Backup doing real work on soreness while capsaicin and menthol take all the credit.' },
    ],
  },
  {
    category: 'Thermals',
    tag: 'Red Only',
    color: 'text-neon-red',
    borderColor: 'border-neon-red/30',
    items: [
      { name: 'Capsaicin Oleoresin', detail: 'Scoville units of pure intent. This is the get loose juice, the swing lube, the real warm-up before rounds.' },
      { name: 'Cinnamon Bark Essential Oil', detail: 'Surface heat on contact. The thermal trigger that tells the rest of the formula it\'s time to work.' },
    ],
  },
];

const STYLE_MAP: Record<string, { borderClass: string; textClass: string }> = {
  red: { borderClass: 'neon-border-red', textClass: 'text-neon-red' },
  blue: { borderClass: 'neon-border-cyan', textClass: 'text-neon-cyan' },
  bundle: { borderClass: 'neon-border-purple', textClass: 'text-neon-purple' },
};

export default async function HomePage() {
  const products = await readData<Product[]>('products.json');
  const activeProducts = products.filter((p) => p.status === 'active');

  return (
    <div className="star-field">
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-red/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="relative w-full max-w-[300px] md:max-w-[500px] lg:max-w-[600px] h-auto mb-6 px-4">
            <Image
              src="/logo.png"
              alt="Swzzle"
              width={600}
              height={200}
              className="w-full h-auto drop-shadow-[0_0_40px_rgba(0,245,255,0.3)]"
              priority
            />
          </div>

          <p className="font-display text-sm md:text-lg uppercase tracking-[0.3em] text-gray-400 mb-10">
            Built From The Same Dirt We Play On
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/products/red"
              className="border-2 border-neon-red text-neon-red font-display font-bold uppercase tracking-wider px-10 py-4 rounded hover:bg-neon-red/10 transition-all duration-300 neon-text-red"
            >
              Get Red
            </Link>
            <Link
              href="/products/blue"
              className="border-2 border-neon-cyan text-neon-cyan font-display font-bold uppercase tracking-wider px-10 py-4 rounded hover:bg-neon-cyan/10 transition-all duration-300 neon-text-cyan"
            >
              Get Blue
            </Link>
          </div>
          <Link
            href="/products/bundle"
            className="mt-4 border-2 border-neon-purple text-neon-purple font-display font-bold uppercase tracking-wider px-10 py-4 rounded hover:bg-neon-purple/10 transition-all duration-300"
          >
            Get Bundle
          </Link>
        </div>
      </section>

      {/* PRODUCT TRIO */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {activeProducts.map((p) => {
            const style = STYLE_MAP[p.id] || STYLE_MAP.bundle;
            return (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className={`border ${style.borderClass} rounded-xl overflow-hidden bg-surface hover:scale-[1.02] transition-all duration-300 flex flex-col text-center group`}
              >
                <div className="relative w-full aspect-square bg-black/30">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className={`font-display font-black text-xl tracking-wider ${style.textClass}`}>
                    {p.name.toUpperCase()}
                  </h3>
                  <p className="text-gray-500 text-sm font-display uppercase tracking-wider mt-1">
                    {p.descriptor}
                  </p>
                  <p className={`font-display font-bold text-2xl mt-3 ${style.textClass}`}>
                    ${p.price}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* THE SWZZLE FULL STACK */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="font-display font-black text-3xl md:text-5xl text-center mb-4 tracking-wider">
          THE SWZZLE FULL STACK
        </h2>
        <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">
          Every ingredient earns its spot or gets cut. No filler. No fairy dust. Just function.
        </p>

        <div className="space-y-12">
          {fullStack.map((group) => (
            <div key={group.category}>
              <div className="flex items-center gap-3 mb-6">
                <h3 className={`font-display font-black text-xl sm:text-2xl tracking-wider ${group.color}`}>
                  {group.category.toUpperCase()}
                </h3>
                {group.tag && (
                  <span className="font-display text-[10px] font-bold uppercase tracking-widest bg-neon-red/15 text-neon-red border border-neon-red/30 px-2.5 py-0.5 rounded-full">
                    {group.tag}
                  </span>
                )}
                <div className={`flex-1 h-px ${group.borderColor} border-t`} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {group.items.map((item) => (
                  <div
                    key={item.name}
                    className={`border ${group.borderColor} rounded-lg p-5 bg-surface hover:bg-surface-light transition-colors`}
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
      </section>

      {/* SOCIAL PROOF */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="font-display font-black text-2xl md:text-4xl text-center mb-12 tracking-wider">
          WHAT THEY&apos;RE SAYING
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-border rounded-xl p-6 bg-surface">
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="text-neon-cyan">&#9733;</span>
              ))}
            </div>
            <p className="text-gray-400 text-sm italic mb-4">
              &ldquo;Skeptical as hell. I&apos;m a Freeze guy for years. My buddy wouldn&apos;t shut up about this stuff, so I finally put some on before our Sunday round. I hate that it worked.&rdquo;
            </p>
            <p className="text-gray-600 text-xs font-display uppercase tracking-wider">
              — Jim B.
            </p>
          </div>
          <div className="border border-border rounded-xl p-6 bg-surface">
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="text-neon-cyan">&#9733;</span>
              ))}
            </div>
            <p className="text-gray-400 text-sm italic mb-4">
              &ldquo;Bought the bundle for my husband. He now hides it from me. We have two bottles of Red and I am not allowed to touch them. Ordering my own.&rdquo;
            </p>
            <p className="text-gray-600 text-xs font-display uppercase tracking-wider">
              — Rachel K.
            </p>
          </div>
          <div className="border border-border rounded-xl p-6 bg-surface">
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="text-neon-cyan">&#9733;</span>
              ))}
            </div>
            <p className="text-gray-400 text-sm italic mb-4">
              &ldquo;I&apos;m 46. I play tournaments every month. My arm has been barking at me for a couple of years. I put Red on before my last league and shot fire. Correlation? Maybe. Am I ever playing without it again? Absolutely not.&rdquo;
            </p>
            <p className="text-gray-600 text-xs font-display uppercase tracking-wider">
              — Jeremy G.
            </p>
          </div>
        </div>
      </section>

      {/* TOURNAMENT SECTION */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display font-black text-2xl md:text-4xl mb-4 tracking-wider">
          OUTFIT YOUR TOURNAMENT
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto mb-8">
          Running a tournament? Get Swzzle into every player&apos;s bag.
          TD player packs at wholesale pricing. MOQ 24 single units or 12 bundles.
        </p>
        <ContactForm subject="TD Wholesale Inquiry" buttonText="Contact For Wholesale" />
      </section>
    </div>
  );
}
