import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { readData, writeData } from '@/lib/data-store';
import type { Customer, Address } from '@/lib/customers';

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customers = await readData<Customer[]>('customers.json');
    const customer = customers.find((c) => c.email === user.email);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer });
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

    const customers = await readData<Customer[]>('customers.json');
    const index = customers.findIndex((c) => c.email === user.email);

    if (index === -1) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (typeof name === 'string') {
      customers[index].name = name.trim();
    }

    if (Array.isArray(addresses)) {
      // Validate each address has required fields
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
