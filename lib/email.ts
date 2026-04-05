import type { Order } from '@/lib/orders';

function getResend() {
  const { Resend } = require('resend') as { Resend: new (key: string) => { emails: { send: (opts: { from: string; to: string; subject: string; html: string }) => Promise<unknown> } } };
  return new Resend(process.env.RESEND_API_KEY || '');
}

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const from = process.env.EMAIL_FROM || 'Swzzle <noreply@swzzle.com>';
  if (!process.env.RESEND_API_KEY) {
    console.log('Email skipped (no RESEND_API_KEY):', opts.subject, '->', opts.to);
    return;
  }
  const resend = getResend();
  await resend.emails.send({ from, ...opts });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function itemRowsHtml(order: Order): string {
  return order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a2e; color: #f0f0f0; font-family: 'Segoe UI', Arial, sans-serif;">
          ${item.name}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a2e; color: #a0a0a0; text-align: center; font-family: 'Segoe UI', Arial, sans-serif;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a2e; color: #f0f0f0; text-align: right; font-family: 'Segoe UI', Arial, sans-serif;">
          ${formatCurrency(item.unitAmount * item.quantity, order.currency)}
        </td>
      </tr>`
    )
    .join('');
}

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin: 0; padding: 0; background-color: #050508; font-family: 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #050508;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #00F5FF; text-transform: uppercase;">
                SWZZLE
              </h1>
            </td>
          </tr>
          <!-- Content card -->
          <tr>
            <td style="background-color: #0a0a10; border: 1px solid #1a1a2e; border-radius: 8px; padding: 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #666;">
                &copy; ${new Date().getFullYear()} Swzzle. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function orderConfirmationHtml(order: Order): string {
  const content = `
    <h2 style="margin: 0 0 8px; font-size: 22px; color: #00F5FF; font-weight: 700;">
      Order Confirmed
    </h2>
    <p style="margin: 0 0 24px; font-size: 14px; color: #a0a0a0;">
      Thanks for your order, ${order.customerName || 'there'}! We're getting it ready.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
      <tr>
        <td style="padding: 8px 0; font-size: 13px; color: #a0a0a0;">Order ID</td>
        <td style="padding: 8px 0; font-size: 13px; color: #f0f0f0; text-align: right; font-family: monospace;">${order.id}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 13px; color: #a0a0a0;">Date</td>
        <td style="padding: 8px 0; font-size: 13px; color: #f0f0f0; text-align: right;">${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr style="background-color: #12121a;">
        <th style="padding: 10px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #00F5FF; font-weight: 600;">Item</th>
        <th style="padding: 10px 16px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #00F5FF; font-weight: 600;">Qty</th>
        <th style="padding: 10px 16px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #00F5FF; font-weight: 600;">Price</th>
      </tr>
      ${itemRowsHtml(order)}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 16px; border-top: 2px solid #00F5FF; text-align: right;">
          <span style="font-size: 13px; color: #a0a0a0; margin-right: 16px;">Total</span>
          <span style="font-size: 20px; font-weight: 700; color: #00F5FF;">
            ${formatCurrency(order.amountTotal, order.currency)}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0; font-size: 13px; color: #a0a0a0; line-height: 1.6;">
      We'll send you a shipping confirmation with tracking info once your order is on its way.
    </p>`;

  return baseLayout(content);
}

export function shippingUpdateHtml(order: Order): string {
  const trackingInfo = order.trackingNumber
    ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; background-color: #12121a; border-radius: 6px;">
      <tr>
        <td style="padding: 20px 24px;">
          <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #00F5FF; font-weight: 600;">Tracking Details</p>
          ${order.trackingCarrier ? `<p style="margin: 0 0 4px; font-size: 14px; color: #f0f0f0;">Carrier: <strong>${order.trackingCarrier}</strong></p>` : ''}
          <p style="margin: 0; font-size: 14px; color: #f0f0f0;">Tracking #: <strong style="font-family: monospace; color: #00F5FF;">${order.trackingNumber}</strong></p>
        </td>
      </tr>
    </table>`
    : '';

  const content = `
    <h2 style="margin: 0 0 8px; font-size: 22px; color: #00F5FF; font-weight: 700;">
      Your Order Has Shipped!
    </h2>
    <p style="margin: 0 0 24px; font-size: 14px; color: #a0a0a0;">
      Great news, ${order.customerName || 'there'}! Your order is on its way.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
      <tr>
        <td style="padding: 8px 0; font-size: 13px; color: #a0a0a0;">Order ID</td>
        <td style="padding: 8px 0; font-size: 13px; color: #f0f0f0; text-align: right; font-family: monospace;">${order.id}</td>
      </tr>
    </table>

    ${trackingInfo}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr style="background-color: #12121a;">
        <th style="padding: 10px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #00F5FF; font-weight: 600;">Item</th>
        <th style="padding: 10px 16px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #00F5FF; font-weight: 600;">Qty</th>
        <th style="padding: 10px 16px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #00F5FF; font-weight: 600;">Price</th>
      </tr>
      ${itemRowsHtml(order)}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 16px; border-top: 2px solid #00F5FF; text-align: right;">
          <span style="font-size: 13px; color: #a0a0a0; margin-right: 16px;">Total</span>
          <span style="font-size: 20px; font-weight: 700; color: #00F5FF;">
            ${formatCurrency(order.amountTotal, order.currency)}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0; font-size: 13px; color: #a0a0a0; line-height: 1.6;">
      If you have any questions about your order, just reply to this email.
    </p>`;

  return baseLayout(content);
}
