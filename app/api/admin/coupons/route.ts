import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    const promotionCodes = await stripe.promotionCodes.list({
      limit: 50,
      expand: ['data.coupon'],
    });

    return NextResponse.json({ promotionCodes: promotionCodes.data });
  } catch (err) {
    console.error('Failed to fetch coupons:', err);
    return NextResponse.json({ error: 'Failed to load coupons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, percentOff, amountOff, currency, maxRedemptions, expiresAt } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Coupon code name is required' }, { status: 400 });
    }

    if (!percentOff && !amountOff) {
      return NextResponse.json(
        { error: 'Either percentOff or amountOff is required' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Create the coupon first
    const coupon = percentOff
      ? await stripe.coupons.create({ percent_off: Number(percentOff) })
      : await stripe.coupons.create({
          amount_off: Math.round(Number(amountOff) * 100),
          currency: (currency as string) || 'usd',
        });

    // Create promotion code with the human-readable code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promoParams: any = {
      coupon: coupon.id,
      code: name.toUpperCase(),
    };
    if (maxRedemptions) promoParams.max_redemptions = Number(maxRedemptions);
    if (expiresAt) promoParams.expires_at = Math.floor(new Date(expiresAt as string).getTime() / 1000);

    const promotionCode = await stripe.promotionCodes.create(promoParams);

    return NextResponse.json({ promotionCode });
  } catch (err) {
    console.error('Failed to create coupon:', err);
    const message = err instanceof Error ? err.message : 'Failed to create coupon';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Promotion code ID is required' }, { status: 400 });
    }

    const stripe = getStripe();
    const promotionCode = await stripe.promotionCodes.update(id, { active: !!active });

    return NextResponse.json({ promotionCode });
  } catch (err) {
    console.error('Failed to update coupon:', err);
    const message = err instanceof Error ? err.message : 'Failed to update coupon';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
