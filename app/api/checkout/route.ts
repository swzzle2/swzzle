import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { readData } from '@/lib/data-store';
import type { Product } from '@/lib/products';

const FREE_SHIPPING_THRESHOLD_CENTS = 2500; // $25.00
const FLAT_RATE_SHIPPING_CENTS = 799; // $7.99

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: { id: string; quantity: number }[] = body.items || body;
    const couponCode: string | undefined = body.couponCode;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const products = await readData<Product[]>('products.json');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const line_items: any[] = [];
    let subtotalCents = 0;

    for (const item of items) {
      const product = products.find((p) => p.id === item.id);
      if (!product) continue;

      subtotalCents += Math.round(product.price * 100) * item.quantity;

      if (product.stripePriceId) {
        line_items.push({
          price: product.stripePriceId,
          quantity: item.quantity,
        });
      } else {
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

    // Build shipping options — Stripe shipping_options are NOT subject to discounts
    const qualifiesFreeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shipping_options: any[] = qualifiesFreeShipping
      ? [
          {
            shipping_rate_data: {
              display_name: 'Free Shipping',
              type: 'fixed_amount',
              fixed_amount: { amount: 0, currency: 'usd' },
            },
          },
        ]
      : [
          {
            shipping_rate_data: {
              display_name: 'Flat Rate Shipping',
              type: 'fixed_amount',
              fixed_amount: { amount: FLAT_RATE_SHIPPING_CENTS, currency: 'usd' },
            },
          },
        ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionParams: any = {
      mode: 'payment',
      line_items,
      shipping_options,
      success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    };

    // If a coupon code was applied in the cart, look up the promo and attach it
    if (couponCode) {
      try {
        const stripe = getStripe();
        const promos = await stripe.promotionCodes.list({ code: couponCode.toUpperCase(), active: true });
        if (promos.data.length > 0) {
          sessionParams.discounts = [{ promotion_code: promos.data[0].id }];
        }
      } catch {
        // If promo lookup fails, still allow checkout without discount
      }
    }

    // Only allow manual promo code entry if no discount already applied
    if (!sessionParams.discounts) {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await getStripe().checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
