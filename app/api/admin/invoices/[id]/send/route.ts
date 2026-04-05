import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { readData, writeData } from '@/lib/data-store';
import { getStripe } from '@/lib/stripe';
import { sendEmail } from '@/lib/email';
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

    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: `Cannot send invoice with status "${invoice.status}". Only draft invoices can be sent.` },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Finalize and send the invoice via Stripe
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sentInvoice = await stripe.invoices.sendInvoice(invoice.stripeInvoiceId) as any;

    // Update local record
    invoices[index] = {
      ...invoice,
      status: 'open',
      hostedUrl: sentInvoice.hosted_invoice_url || undefined,
      pdfUrl: sentInvoice.invoice_pdf || undefined,
      updatedAt: new Date().toISOString(),
    };

    await writeData('invoices.json', invoices);

    // Send branded email with payment link
    if (invoice.customerEmail && sentInvoice.hosted_invoice_url) {
      try {
        const totalFormatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(invoice.total / 100);

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
              <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #00F5FF; text-transform: uppercase;">SWZZLE</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0a0a10; border: 1px solid #1a1a2e; border-radius: 8px; padding: 32px;">
              <h2 style="margin: 0 0 8px; font-size: 22px; color: #00F5FF; font-weight: 700;">Wholesale Invoice</h2>
              <p style="margin: 0 0 24px; font-size: 14px; color: #a0a0a0;">
                Hi ${invoice.customerName},<br />
                Here is your wholesale invoice for ${invoice.companyName}.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                ${invoice.items.map((item) => `
                <tr>
                  <td style="padding: 8px 16px; border-bottom: 1px solid #1a1a2e; color: #f0f0f0; font-size: 14px;">
                    ${item.name} x${item.quantity}
                  </td>
                  <td style="padding: 8px 16px; border-bottom: 1px solid #1a1a2e; color: #f0f0f0; text-align: right; font-size: 14px;">
                    $${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                  </td>
                </tr>`).join('')}
                ${invoice.shippingCost > 0 ? `
                <tr>
                  <td style="padding: 8px 16px; border-bottom: 1px solid #1a1a2e; color: #a0a0a0; font-size: 14px;">Shipping</td>
                  <td style="padding: 8px 16px; border-bottom: 1px solid #1a1a2e; color: #f0f0f0; text-align: right; font-size: 14px;">
                    $${(invoice.shippingCost / 100).toFixed(2)}
                  </td>
                </tr>` : ''}
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 16px; border-top: 2px solid #00F5FF; text-align: right;">
                    <span style="font-size: 13px; color: #a0a0a0; margin-right: 16px;">Total</span>
                    <span style="font-size: 20px; font-weight: 700; color: #00F5FF;">${totalFormatted}</span>
                  </td>
                </tr>
              </table>
              ${invoice.memo ? `<p style="margin: 16px 0 0; font-size: 13px; color: #a0a0a0; line-height: 1.6;">${invoice.memo}</p>` : ''}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${sentInvoice.hosted_invoice_url}" style="display: inline-block; padding: 14px 32px; background-color: #00F5FF; color: #050508; font-weight: 700; text-decoration: none; border-radius: 6px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                      View &amp; Pay Invoice
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 12px; color: #666; text-align: center;">
                Payment is due within ${invoice.daysUntilDue} days.
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
      } catch (emailErr) {
        console.error('Failed to send invoice email:', emailErr);
        // Don't fail the API call if email fails
      }
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
