import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { readData, writeData } from '@/lib/data-store';
import type { Inquiry } from '@/app/api/contact/route';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let inquiries: Inquiry[] = [];
    try {
      inquiries = await readData<Inquiry[]>('inquiries.json');
    } catch {
      // empty
    }

    const source = request.nextUrl.searchParams.get('source');
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      const inquiry = inquiries.find((i) => i.id === id);
      if (!inquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ inquiry });
    }

    if (source) {
      inquiries = inquiries.filter((i) => i.source === source);
    }

    return NextResponse.json({ inquiries });
  } catch (err) {
    console.error('Failed to fetch inquiries:', err);
    return NextResponse.json({ error: 'Failed to load inquiries' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, note } = body as { id: string; status?: string; note?: string };

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    let inquiries: Inquiry[] = [];
    try {
      inquiries = await readData<Inquiry[]>('inquiries.json');
    } catch {
      return NextResponse.json({ error: 'No inquiries found' }, { status: 404 });
    }

    const index = inquiries.findIndex((i) => i.id === id);
    if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (status) {
      inquiries[index].status = status as Inquiry['status'];
    }

    if (note && note.trim()) {
      inquiries[index].notes.push(
        `[${new Date().toLocaleString()}] ${note.trim()}`
      );
    }

    await writeData('inquiries.json', inquiries);
    return NextResponse.json({ inquiry: inquiries[index] });
  } catch (err) {
    console.error('Failed to update inquiry:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
