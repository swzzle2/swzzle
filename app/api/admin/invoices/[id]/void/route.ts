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
    let invoices: WholesaleInvoice[] = [];
    try {
      invoices = await readData<WholesaleInvoice[]>('invoices.json');
    } catch {
      return NextResponse.json({ error: 'No invoices found' }, { status: 404 });
    }

    const index = invoices.findIndex((inv) => inv.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoices[index].status === 'paid') {
      return NextResponse.json({ error: 'Cannot void a paid invoice' }, { status: 400 });
    }

    // Expire the Stripe checkout session if one exists
    if (invoices[index].stripeInvoiceId) {
      try {
        const stripe = getStripe();
        await stripe.checkout.sessions.expire(invoices[index].stripeInvoiceId);
      } catch {
        // Session may already be expired or completed
      }
    }

    invoices[index].status = 'void';
    invoices[index].updatedAt = new Date().toISOString();
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
