import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { readData } from '@/lib/data-store';
import { sendEmail, shippingUpdateHtml } from '@/lib/email';
import type { Order } from '@/lib/orders';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const orders = await readData<Order[]>('orders.json');
    const order = orders.find((o) => o.id === id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.trackingNumber) {
      return NextResponse.json(
        { error: 'Order must have a tracking number before sending notification' },
        { status: 400 }
      );
    }

    if (!order.customerEmail) {
      return NextResponse.json(
        { error: 'Order has no customer email' },
        { status: 400 }
      );
    }

    await sendEmail({
      to: order.customerEmail,
      subject: `Your Swzzle order has been ${order.status === 'delivered' ? 'delivered' : 'shipped'}!`,
      html: shippingUpdateHtml(order),
    });

    return NextResponse.json({ success: true, message: 'Shipping notification sent' });
  } catch (err) {
    console.error('Failed to send shipping notification:', err);
    return NextResponse.json(
      { error: 'Failed to send notification email' },
      { status: 500 }
    );
  }
}
