import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { writeData } from '@/lib/data-store';

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await writeData('invoices.json', []);
  return NextResponse.json({ success: true, message: 'Invoices cleared' });
}
