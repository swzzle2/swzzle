import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settings';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  const settings = getSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  saveSettings(body);
  return NextResponse.json({ success: true });
}
