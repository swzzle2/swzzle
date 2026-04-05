import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { readData, writeData } from '@/lib/data-store';
import { getStripe } from '@/lib/stripe';
import type { WholesaleInvoice, InvoiceLineItem } from '@/lib/invoices';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let invoices: WholesaleInvoice[] = [];
  try {
    invoices = await readData<WholesaleInvoice[]>('invoices.json');
  } catch {
    // empty
  }

  const id = request.nextUrl.searchParams.get('id');
  if (id) {
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json(invoice);
  }

  const status = request.nextUrl.searchParams.get('status');
  if (status) {
    return NextResponse.json(invoices.filter((inv) => inv.status === status));
  }

  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      companyName,
      items,
      shippingCost,
      memo,
      daysUntilDue,
    } = body as {
      customerName: string;
      customerEmail: string;
      companyName: string;
      items: InvoiceLineItem[];
      shippingCost: number;
      memo?: string;
      daysUntilDue: number;
    };

    if (!customerName || !customerEmail || !companyName || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = subtotal + (shippingCost || 0);

    // Save local record as draft (no Stripe object yet — created on send)
    const now = new Date().toISOString();
    const invoice: WholesaleInvoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      stripeInvoiceId: '', // set on send
      stripeCustomerId: '',
      customerName,
      customerEmail,
      companyName,
      items,
      shippingCost: shippingCost || 0,
      subtotal,
      total,
      currency: 'usd',
      memo,
      daysUntilDue: daysUntilDue || 30,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    let invoices: WholesaleInvoice[] = [];
    try {
      invoices = await readData<WholesaleInvoice[]>('invoices.json');
    } catch {
      // empty
    }
    invoices.push(invoice);
    await writeData('invoices.json', invoices);

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { error: `Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
