import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { readData } from '@/lib/data-store';
import type { Order } from '@/lib/orders';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orders = await readData<Order[]>('orders.json');
    const customerOrders = orders
      .filter((o) => o.customerEmail === session.user!.email)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const id = request.nextUrl.searchParams.get('id');
    if (id) {
      const order = customerOrders.find((o) => o.id === id);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ order });
    }

    return NextResponse.json({ orders: customerOrders });
  } catch (err) {
    console.error('Failed to fetch customer orders:', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
