import { getStripe } from '@/lib/stripe';
import { readData, writeData } from '@/lib/data-store';
import { sendEmail, orderConfirmationHtml } from '@/lib/email';
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

  if (event.type === 'invoice.paid') {
    try {
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
    } catch (err) {
      console.error('Error handling invoice.paid:', err);
      return new Response('Webhook handler error', { status: 500 });
    }
  }

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

  existingOrders.push(order);
  await writeData('orders.json', existingOrders);
  console.log('Order created:', order.id);

  // Send confirmation email
  if (customerEmail) {
    try {
      await sendEmail({
        to: customerEmail,
        subject: `Order Confirmed - ${order.id}`,
        html: orderConfirmationHtml(order),
      });
    } catch (err) {
      console.error('Failed to send order confirmation email:', err);
      // Don't fail the webhook if email fails
    }
  }
}

async function handleInvoicePaid(stripeInvoice: Stripe.Invoice) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceObj = stripeInvoice as any;

  // Only handle invoices created from wholesale HQ
  if (invoiceObj.metadata?.source !== 'wholesale_hq') {
    return;
  }

  const invoices = await readData<WholesaleInvoice[]>('invoices.json');
  const index = invoices.findIndex((inv) => inv.stripeInvoiceId === stripeInvoice.id);

  if (index === -1) {
    console.log('No local invoice record found for Stripe invoice:', stripeInvoice.id);
    return;
  }

  const invoice = invoices[index];

  // Idempotency: skip if already paid
  if (invoice.status === 'paid') {
    console.log('Invoice already marked as paid:', invoice.id);
    return;
  }

  // Create an Order record
  const existingOrders = await readData<Order[]>('orders.json');
  const now = new Date().toISOString();

  const orderItems: OrderItem[] = invoice.items.map((item) => ({
    productId: item.productId || '',
    name: item.name,
    quantity: item.quantity,
    unitAmount: item.unitPrice,
  }));

  const order: Order = {
    id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    stripeSessionId: stripeInvoice.id, // use invoice ID for traceability
    customerEmail: invoice.customerEmail,
    customerName: invoice.customerName,
    items: orderItems,
    amountTotal: invoiceObj.amount_paid || invoice.total,
    currency: invoice.currency,
    status: 'paid',
    notes: `Wholesale invoice for ${invoice.companyName}`,
    createdAt: now,
    updatedAt: now,
  };

  existingOrders.push(order);
  await writeData('orders.json', existingOrders);
  console.log('Wholesale order created:', order.id, 'from invoice:', invoice.id);

  // Update the invoice record
  invoices[index] = {
    ...invoice,
    status: 'paid',
    orderId: order.id,
    hostedUrl: invoiceObj.hosted_invoice_url || invoice.hostedUrl,
    pdfUrl: invoiceObj.invoice_pdf || invoice.pdfUrl,
    updatedAt: now,
  };

  await writeData('invoices.json', invoices);

  // Send confirmation email
  if (invoice.customerEmail) {
    try {
      await sendEmail({
        to: invoice.customerEmail,
        subject: `Payment Received - Invoice for ${invoice.companyName}`,
        html: orderConfirmationHtml(order),
      });
    } catch (err) {
      console.error('Failed to send wholesale payment confirmation:', err);
    }
  }
}
