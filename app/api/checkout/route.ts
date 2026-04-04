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

    const line_items: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; images: string[] };
        unit_amount: number;
      };
      quantity: number;
    }> = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.id);
      if (!product) continue;

      // Handle both relative paths and absolute Blob URLs
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

    if (line_items.length === 0) {
      return NextResponse.json(
        { error: 'No valid products found' },
        { status: 400 }
      );
    }

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items,
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
