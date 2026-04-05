import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { readData, writeData } from '@/lib/data-store';
import type { Order } from '@/lib/orders';

const PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orders = await readData<Order[]>('orders.json');
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      const order = orders.find((o) => o.id === id);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ order });
    }

    // Sort by createdAt descending (newest first)
    const sorted = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const paged = sorted.slice(start, start + PAGE_SIZE);

    return NextResponse.json({
      orders: paged,
      total,
      page: safePage,
      totalPages,
    });
  } catch (err) {
    console.error('Failed to read orders:', err);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, trackingNumber, trackingCarrier, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const validStatuses = ['paid', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const orders = await readData<Order[]>('orders.json');
    const index = orders.findIndex((o) => o.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (status !== undefined) orders[index].status = status;
    if (trackingNumber !== undefined) orders[index].trackingNumber = trackingNumber;
    if (trackingCarrier !== undefined) orders[index].trackingCarrier = trackingCarrier;
    if (notes !== undefined) orders[index].notes = notes;
    orders[index].updatedAt = new Date().toISOString();

    await writeData('orders.json', orders);

    return NextResponse.json({ order: orders[index] });
  } catch (err) {
    console.error('Failed to update order:', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
