import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data-store';

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  date: string;
  status: 'new' | 'contacted' | 'negotiating' | 'closed-won' | 'closed-lost';
  notes: string[];
  source: 'wholesale' | 'general';
};

export async function POST(request: Request) {
  try {
    const { name, email, phone, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    let inquiries: Inquiry[] = [];
    try {
      inquiries = await readData<Inquiry[]>('inquiries.json');
    } catch {
      // File doesn't exist yet, start fresh
    }

    const inquiry: Inquiry = {
      id: crypto.randomUUID(),
      name,
      email,
      phone: phone || undefined,
      subject: subject || 'General Inquiry',
      message,
      date: new Date().toISOString(),
      status: 'new',
      notes: [],
      source: subject === 'TD Wholesale Inquiry' ? 'wholesale' : 'general',
    };

    inquiries.unshift(inquiry);
    await writeData('inquiries.json', inquiries);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}
