import { getStripe } from '@/lib/stripe';
import { readData, writeData } from '@/lib/data-store';
import { sendEmail, orderConfirmationHtml, wholesalePaymentReceivedHtml } from '@/lib/email';
import type { Order, OrderItem } from '@/lib/orders';
import type { Customer } from '@/lib/customers';
import type { WholesaleInvoice } from '@/lib/invoices';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    try {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } catch (err) {
      console.error('Error handling checkout.session.completed:', err);
      return new Response('Webhook handler error', { status: 500 });
    }
  }

  // invoice.paid no longer used — wholesale uses checkout.session.completed

  return new Response('OK', { status: 200 });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const stripe = getStripe();

  // Idempotency check
  const existingOrders = await readData<Order[]>('orders.json');
  if (existingOrders.some((o) => o.stripeSessionId === session.id)) {
    console.log('Order already exists for session:', session.id);
    return;
  }

  // Retrieve line items
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
  });

  const items: OrderItem[] = lineItems.data.map((li) => ({
    productId: (li.price?.product as string) || '',
    name: li.description || 'Unknown item',
    quantity: li.quantity || 1,
    unitAmount: li.price?.unit_amount || 0,
  }));

  // Look up customer record
  let customerId: string | undefined;
  const customerEmail = session.customer_details?.email || session.customer_email || '';

  if (customerEmail) {
    try {
      const customers = await readData<Customer[]>('customers.json');
      const customer = customers.find((c) => c.email === customerEmail);
      if (customer) {
        customerId = customer.id;
      }
    } catch {
      // Continue without customerId
    }
  }

  // Determine coupon code if a discount was applied
  let couponCode: string | undefined;
  if (session.total_details?.breakdown?.discounts && session.total_details.breakdown.discounts.length > 0) {
    const discount = session.total_details.breakdown.discounts[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const discountObj = discount.discount as any;
    couponCode = discountObj?.coupon?.name || undefined;
  }

  const now = new Date().toISOString();
  const order: Order = {
    id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    stripeSessionId: session.id,
    customerEmail,
    customerName: session.customer_details?.name || '',
    customerId,
    items,
    amountTotal: session.amount_total || 0,
    currency: session.currency || 'usd',
    status: 'paid',
    couponCode,
    createdAt: now,
    updatedAt: now,
  };

  // Check if this is a wholesale invoice payment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = (session as any).metadata || {};
  const isWholesale = metadata.source === 'wholesale_hq';
  const invoiceId = metadata.invoiceId;
  const companyName = metadata.companyName || '';

  if (isWholesale) {
    order.notes = `Wholesale invoice for ${companyName}`;
  }

  existingOrders.push(order);
  await writeData('orders.json', existingOrders);
  console.log('Order created:', order.id, isWholesale ? '(wholesale)' : '(retail)');

  // If wholesale, link the order back to the invoice record
  if (isWholesale && invoiceId) {
    try {
      const invoices = await readData<WholesaleInvoice[]>('invoices.json');
      const invIndex = invoices.findIndex((inv) => inv.id === invoiceId);
      if (invIndex !== -1) {
        invoices[invIndex].status = 'paid';
        invoices[invIndex].orderId = order.id;
        invoices[invIndex].updatedAt = new Date().toISOString();
        await writeData('invoices.json', invoices);
        console.log('Invoice marked paid:', invoiceId);
      }
    } catch (err) {
      console.error('Failed to update invoice record:', err);
    }
  }

  // Send appropriate email
  if (customerEmail) {
    try {
      if (isWholesale) {
        await sendEmail({
          to: customerEmail,
          subject: `Payment Received - Wholesale Order for ${companyName}`,
          html: wholesalePaymentReceivedHtml(order, companyName),
        });
      } else {
        await sendEmail({
          to: customerEmail,
          subject: `Order Confirmed - ${order.id}`,
          html: orderConfirmationHtml(order),
        });
      }
    } catch (err) {
      console.error('Failed to send email:', err);
    }
  }
}

// handleInvoicePaid removed — wholesale now uses checkout.session.completed
