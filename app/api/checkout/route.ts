import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { readData } from '@/lib/data-store';
import type { Product } from '@/lib/products';
export async function POST(request: Request) {
  try {
    const items: { id: string; quantity: number }[] = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const products = await readData<Product[]>('products.json');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const line_items: any[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.id);
      if (!product) continue;

      if (product.stripePriceId) {
        // Use existing Stripe Price
        line_items.push({
          price: product.stripePriceId,
          quantity: item.quantity,
        });
      } else {
        // Fallback to inline price_data
        let imageUrl = '';
        if (product.image) {
          imageUrl = product.image.startsWith('http')
            ? product.image
            : `${origin}${product.image}`;
        }

        line_items.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              images: imageUrl ? [imageUrl] : [],
            },
            unit_amount: Math.round(product.price * 100),
          },
          quantity: item.quantity,
        });
      }
    }

    if (line_items.length === 0) {
      return NextResponse.json(
        { error: 'No valid products found' },
        { status: 400 }
      );
    }

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items,
      allow_promotion_codes: true,
      success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
