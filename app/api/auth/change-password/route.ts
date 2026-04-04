import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: false,
    message:
      'Cannot change password at runtime. Update ADMIN_PASSWORD in your .env.local file and restart the server.',
  });
}
