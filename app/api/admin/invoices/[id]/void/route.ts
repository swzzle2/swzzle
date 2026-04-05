import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { readData, writeData } from '@/lib/data-store';
import { getStripe } from '@/lib/stripe';
import type { WholesaleInvoice } from '@/lib/invoices';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const invoices = await readData<WholesaleInvoice[]>('invoices.json');
    const index = invoices.findIndex((inv) => inv.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoices[index];

    if (invoice.status === 'void') {
      return NextResponse.json({ error: 'Invoice is already voided' }, { status: 400 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Cannot void a paid invoice' }, { status: 400 });
    }

    const stripe = getStripe();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await stripe.invoices.voidInvoice(invoice.stripeInvoiceId) as any;

    invoices[index] = {
      ...invoice,
      status: 'void',
      updatedAt: new Date().toISOString(),
    };

    await writeData('invoices.json', invoices);

    return NextResponse.json(invoices[index]);
  } catch (error) {
    console.error('Invoice void error:', error);
    return NextResponse.json(
      { error: `Failed to void invoice: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
