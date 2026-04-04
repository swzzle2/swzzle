import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startingAfter = request.nextUrl.searchParams.get('starting_after');

    const params: {
      limit: number;
      expand: string[];
      starting_after?: string;
    } = {
      limit: 25,
      expand: ['data.line_items'],
    };

    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const sessions = await getStripe().checkout.sessions.list(params);

    return NextResponse.json({
      sessions: sessions.data,
      has_more: sessions.has_more,
    });
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    return NextResponse.json(
      { error: 'Failed to fetch orders from Stripe' },
      { status: 500 }
    );
  }
}
