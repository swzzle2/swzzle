import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { readData, writeData } from '@/lib/data-store';
import { getStripe } from '@/lib/stripe';
import type { Product } from '@/lib/products';

async function syncProductToStripe(product: Product, origin?: string): Promise<{ stripeProductId: string; stripePriceId: string }> {
  const stripe = getStripe();

  // Build image URL
  let imageUrl = '';
  if (product.image) {
    imageUrl = product.image.startsWith('http')
      ? product.image
      : origin
      ? `${origin}${product.image}`
      : '';
  }

  if (product.stripeProductId) {
    // Update existing Stripe product
    await stripe.products.update(product.stripeProductId, {
      name: product.name,
      description: product.shortDescription || undefined,
      active: product.status === 'active',
      ...(imageUrl ? { images: [imageUrl] } : {}),
    });

    // Check if price changed — if so, create new price and archive old one
    const existingPrice = product.stripePriceId
      ? await stripe.prices.retrieve(product.stripePriceId)
      : null;

    const newAmountCents = Math.round(product.price * 100);

    if (!existingPrice || existingPrice.unit_amount !== newAmountCents) {
      // Archive old price
      if (product.stripePriceId) {
        await stripe.prices.update(product.stripePriceId, { active: false });
      }
      // Create new price
      const newPrice = await stripe.prices.create({
        product: product.stripeProductId,
        unit_amount: newAmountCents,
        currency: 'usd',
      });
      return { stripeProductId: product.stripeProductId, stripePriceId: newPrice.id };
    }

    return { stripeProductId: product.stripeProductId, stripePriceId: product.stripePriceId! };
  } else {
    // Create new Stripe product + price
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.shortDescription || undefined,
      active: product.status === 'active',
      metadata: { swzzle_id: product.id },
      ...(imageUrl ? { images: [imageUrl] } : {}),
    });

    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(product.price * 100),
      currency: 'usd',
    });

    return { stripeProductId: stripeProduct.id, stripePriceId: stripePrice.id };
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  const products = await readData<Product[]>('products.json');

  if (id) {
    const product = products.find((p) => p.id === id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  }

  return NextResponse.json(products);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const products = await readData<Product[]>('products.json');

    const baseSlug = slugify(body.name || 'new-product');
    let id = baseSlug;
    let n = 2;
    while (products.some((p) => p.id === id)) {
      id = `${baseSlug}-${n++}`;
    }

    const newProduct: Product = {
      id,
      name: body.name || 'New Product',
      descriptor: body.descriptor || '',
      price: typeof body.price === 'number' ? body.price : 0,
      status: 'inactive',
      mainPageDisplay: false,
      shortDescription: body.shortDescription || '',
      longDescription: body.longDescription || '',
      ingredients: body.ingredients || '',
      directions: body.directions || '',
      warnings: body.warnings || '',
      image: body.image || '',
      images: [],
      color: body.color || '#00E5FF',
    };

    products.push(newProduct);
    await writeData('products.json', products);
    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Product create error:', error);
    return NextResponse.json(
      { error: `Create failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const products = await readData<Product[]>('products.json');
  const remaining = products.filter((p) => p.id !== id);
  if (remaining.length === products.length) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  await writeData('products.json', remaining);
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updatedProduct = await request.json();
    const products = await readData<Product[]>('products.json');

    const index = products.findIndex((p: Product) => p.id === updatedProduct.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Merge updates
    products[index] = { ...products[index], ...updatedProduct };

    // Enforce single main-page product: if this one is flagged, clear the flag on all others.
    if (products[index].mainPageDisplay) {
      products.forEach((p, i) => {
        if (i !== index) p.mainPageDisplay = false;
      });
    }

    // Sync to Stripe
    try {
      const origin = new URL(request.url).origin;
      const { stripeProductId, stripePriceId } = await syncProductToStripe(products[index], origin);
      products[index].stripeProductId = stripeProductId;
      products[index].stripePriceId = stripePriceId;
    } catch (stripeErr) {
      console.error('Stripe sync error:', stripeErr);
      // Save product data even if Stripe sync fails — don't block the save
    }

    await writeData('products.json', products);

    return NextResponse.json({ success: true, product: products[index] });
  } catch (error) {
    console.error('Product save error:', error);
    return NextResponse.json(
      { error: `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
