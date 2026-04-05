import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { readData, writeData } from '@/lib/data-store';
import { getStripe } from '@/lib/stripe';
import { sendEmail } from '@/lib/email';
import type { WholesaleInvoice } from '@/lib/invoices';

export async function POST(
  request: Request,
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

    const invoice = invoices[index];

    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: `Cannot send invoice with status "${invoice.status}"` },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const origin = new URL(request.url).origin;

    // Build line items for Stripe Checkout — same proven approach as retail
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const line_items: any[] = invoice.items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: item.unitPrice,
      },
      quantity: item.quantity,
    }));

    // Add shipping as a separate line item if > 0
    if (invoice.shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Shipping' },
          unit_amount: invoice.shippingCost,
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session — this is the proven payment flow
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: invoice.customerEmail,
      success_url: `${origin}/wholesale/thank-you?invoice=${invoice.id}`,
      cancel_url: `${origin}/wholesale/invoice/${invoice.id}`,
      metadata: {
        source: 'wholesale_hq',
        invoiceId: invoice.id,
        companyName: invoice.companyName,
      },
    });

    const paymentUrl = session.url || '';

    // Update local record
    invoices[index] = {
      ...invoice,
      status: 'open',
      stripeInvoiceId: session.id, // store checkout session ID
      hostedUrl: paymentUrl,
      updatedAt: new Date().toISOString(),
    };

    await writeData('invoices.json', invoices);

    // Send branded invoice email with payment link
    if (invoice.customerEmail && paymentUrl) {
      const totalFormatted = `$${(invoice.total / 100).toFixed(2)}`;

      await sendEmail({
        to: invoice.customerEmail,
        subject: `Invoice from Swzzle - ${totalFormatted}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin: 0; padding: 0; background-color: #050508; font-family: 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #050508;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #00F5FF;">SWZZLE</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0a0a10; border: 1px solid #1a1a2e; border-radius: 8px; padding: 32px;">
              <h2 style="margin: 0 0 8px; font-size: 22px; color: #00F5FF; font-weight: 700;">Wholesale Invoice</h2>
              <p style="margin: 0 0 24px; font-size: 14px; color: #a0a0a0;">
                Hi ${invoice.customerName},<br/>
                Here is your wholesale invoice for <strong>${invoice.companyName}</strong>.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr style="background-color: #12121a;">
                  <th style="padding: 10px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #00F5FF;">Item</th>
                  <th style="padding: 10px 16px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #00F5FF;">Qty</th>
                  <th style="padding: 10px 16px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #00F5FF;">Price</th>
                </tr>
                ${invoice.items.map((item) => `
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a2e; color: #f0f0f0; font-size: 14px;">${item.name}</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a2e; color: #a0a0a0; text-align: center; font-size: 14px;">${item.quantity}</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a2e; color: #f0f0f0; text-align: right; font-size: 14px;">$${((item.unitPrice * item.quantity) / 100).toFixed(2)}</td>
                </tr>`).join('')}
                ${invoice.shippingCost > 0 ? `
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a2e; color: #a0a0a0; font-size: 14px;">Shipping</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a2e; color: #a0a0a0; text-align: center; font-size: 14px;">1</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a2e; color: #f0f0f0; text-align: right; font-size: 14px;">$${(invoice.shippingCost / 100).toFixed(2)}</td>
                </tr>` : ''}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 16px; border-top: 2px solid #00F5FF; text-align: right;">
                    <span style="font-size: 13px; color: #a0a0a0; margin-right: 16px;">Total Due</span>
                    <span style="font-size: 24px; font-weight: 700; color: #00F5FF;">${totalFormatted}</span>
                  </td>
                </tr>
              </table>

              ${invoice.memo ? `<p style="margin: 16px 0 0; font-size: 13px; color: #a0a0a0; line-height: 1.6;"><em>${invoice.memo}</em></p>` : ''}

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${paymentUrl}" style="display: inline-block; padding: 16px 40px; background-color: #00F5FF; color: #050508; font-weight: 700; text-decoration: none; border-radius: 6px; font-size: 16px; letter-spacing: 1px; text-transform: uppercase;">
                      Pay ${totalFormatted} Now
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 12px; color: #666; text-align: center;">
                Payment due within ${invoice.daysUntilDue} days. Questions? Reply to this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #666;">&copy; ${new Date().getFullYear()} Swzzle. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      });
    }

    return NextResponse.json(invoices[index]);
  } catch (error) {
    console.error('Invoice send error:', error);
    return NextResponse.json(
      { error: `Failed to send invoice: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
