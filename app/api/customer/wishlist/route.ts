import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { readData, writeData } from '@/lib/data-store';
import type { Customer } from '@/lib/customers';
import { getProduct } from '@/lib/products';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customers = await readData<Customer[]>('customers.json');
    const customer = customers.find((c) => c.email === session.user!.email);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const products = customer.wishlist
      .map((id) => getProduct(id))
      .filter(Boolean);

    return NextResponse.json({ wishlist: customer.wishlist, products });
  } catch (err) {
    console.error('Failed to fetch wishlist:', err);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId } = (await request.json()) as { productId: string };
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Verify product exists
    const product = getProduct(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const customers = await readData<Customer[]>('customers.json');
    const index = customers.findIndex((c) => c.email === session.user!.email);

    if (index === -1) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (!customers[index].wishlist.includes(productId)) {
      customers[index].wishlist.push(productId);
      await writeData('customers.json', customers);
    }

    return NextResponse.json({ wishlist: customers[index].wishlist });
  } catch (err) {
    console.error('Failed to add to wishlist:', err);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId } = (await request.json()) as { productId: string };
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const customers = await readData<Customer[]>('customers.json');
    const index = customers.findIndex((c) => c.email === session.user!.email);

    if (index === -1) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    customers[index].wishlist = customers[index].wishlist.filter((id) => id !== productId);
    await writeData('customers.json', customers);

    return NextResponse.json({ wishlist: customers[index].wishlist });
  } catch (err) {
    console.error('Failed to remove from wishlist:', err);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}
