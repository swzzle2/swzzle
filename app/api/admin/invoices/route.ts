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
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // 1. Find or create Stripe customer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 } as any);
    let customerId: string;

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newCustomer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: { company: companyName },
      } as any);
      customerId = newCustomer.id;
    }

    // 2. Create invoice items — use `amount` (total in cents for the line)
    //    Stripe invoiceItems.create uses `amount` not `unit_amount`
    for (const item of items) {
      const lineTotal = item.unitPrice * item.quantity;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await stripe.invoiceItems.create({
        customer: customerId,
        amount: lineTotal,
        currency: 'usd',
        description: `${item.name} (${item.quantity} × $${(item.unitPrice / 100).toFixed(2)})`,
      } as any);
    }

    // 3. Add shipping if > 0
    if (shippingCost > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await stripe.invoiceItems.create({
        customer: customerId,
        amount: shippingCost,
        currency: 'usd',
        description: 'Shipping',
      } as any);
    }

    // 4. Create the Stripe invoice
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripeInvoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: daysUntilDue || 30,
      description: memo || undefined,
      metadata: { source: 'wholesale_hq' },
    } as any);

    // 5. Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = subtotal + (shippingCost || 0);

    // 6. Save local record
    const now = new Date().toISOString();
    const invoice: WholesaleInvoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      stripeInvoiceId: stripeInvoice.id,
      stripeCustomerId: customerId,
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
