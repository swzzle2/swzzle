import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { readData, writeData } from '@/lib/data-store';
import type { Customer, Address } from '@/lib/customers';

async function getOrCreateCustomer(email: string, name?: string): Promise<{ customers: Customer[]; index: number }> {
  const customers = await readData<Customer[]>('customers.json');
  let index = customers.findIndex((c) => c.email === email);

  if (index === -1) {
    const newCustomer: Customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      email,
      name: name || '',
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
    const { customers, index } = await getOrCreateCustomer(
      user.email,
      user.user_metadata?.full_name || user.user_metadata?.name
    );
    return NextResponse.json({ customer: customers[index] });
  } catch (err) {
    console.error('Failed to fetch customer profile:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, addresses } = body as { name?: string; addresses?: Address[] };

    const { customers, index } = await getOrCreateCustomer(user.email);

    if (typeof name === 'string') {
      customers[index].name = name.trim();
    }

    if (Array.isArray(addresses)) {
      const validAddresses = addresses.filter(
        (a) => a.name && a.line1 && a.city && a.state && a.zip && a.country
      );
      customers[index].addresses = validAddresses;
    }

    await writeData('customers.json', customers);

    return NextResponse.json({ customer: customers[index] });
  } catch (err) {
    console.error('Failed to update customer profile:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
