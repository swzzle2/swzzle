import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data-store';

type Subscriber = {
  email: string;
  subscribedAt: string;
};

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email: string };

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let subscribers: Subscriber[] = [];
    try {
      subscribers = await readData<Subscriber[]>('subscribers.json');
    } catch {
      // File might be empty or missing — start fresh
      subscribers = [];
    }

    const exists = subscribers.some((s) => s.email === normalizedEmail);
    if (exists) {
      return NextResponse.json({ message: 'Already subscribed' });
    }

    subscribers.push({
      email: normalizedEmail,
      subscribedAt: new Date().toISOString(),
    });

    await writeData('subscribers.json', subscribers);

    return NextResponse.json({ message: 'Subscribed successfully' });
  } catch (err) {
    console.error('Failed to subscribe:', err);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
