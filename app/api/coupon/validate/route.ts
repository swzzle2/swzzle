import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const promotionCodes = await stripe.promotionCodes.list({
      code: code.toUpperCase(),
      active: true,
      expand: ['data.coupon'],
    });

    if (promotionCodes.data.length === 0) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired coupon code' });
    }

    const promo = promotionCodes.data[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coupon = (promo as any).coupon;

    // Check if max redemptions reached
    if (promo.max_redemptions && promo.times_redeemed >= promo.max_redemptions) {
      return NextResponse.json({ valid: false, error: 'This coupon has been fully redeemed' });
    }

    // Check expiration
    if (promo.expires_at && promo.expires_at < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ valid: false, error: 'This coupon has expired' });
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      promoId: promo.id,
      percentOff: coupon.percent_off || undefined,
      amountOff: coupon.amount_off || undefined,
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ valid: false, error: 'Failed to validate coupon' }, { status: 500 });
  }
}
