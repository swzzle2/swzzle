import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data-store';

type Inquiry = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
};

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

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
      subject: subject || 'General Inquiry',
      message,
      date: new Date().toISOString(),
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
