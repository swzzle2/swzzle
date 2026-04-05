import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { readData, writeData } from '@/lib/data-store';
import type { Customer } from '@/lib/customers';
import type { Product } from '@/lib/products';

async function getOrCreateCustomer(email: string): Promise<{ customers: Customer[]; index: number }> {
  const customers = await readData<Customer[]>('customers.json');
  let index = customers.findIndex((c) => c.email === email);

  if (index === -1) {
    const newCustomer: Customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      email,
      name: '',
      addresses: [],
      wishlist: [],
      createdAt: new Date().toISOString(),
    };
    customers.push(newCustomer);
    await writeData('customers.json', customers);
    index = customers.length - 1;
  }

  return { customers, index };
}

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { customers, index } = await getOrCreateCustomer(user.email);
    const allProducts = await readData<Product[]>('products.json');

    const products = customers[index].wishlist
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean);

    return NextResponse.json({ wishlist: customers[index].wishlist, products });
  } catch (err) {
    console.error('Failed to fetch wishlist:', err);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId } = (await request.json()) as { productId: string };
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const allProducts = await readData<Product[]>('products.json');
    if (!allProducts.find((p) => p.id === productId)) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { customers, index } = await getOrCreateCustomer(user.email);

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
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId } = (await request.json()) as { productId: string };
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const { customers, index } = await getOrCreateCustomer(user.email);

    customers[index].wishlist = customers[index].wishlist.filter((id) => id !== productId);
    await writeData('customers.json', customers);

    return NextResponse.json({ wishlist: customers[index].wishlist });
  } catch (err) {
    console.error('Failed to remove from wishlist:', err);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}
