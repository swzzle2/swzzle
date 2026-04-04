import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { readData, writeData } from '@/lib/data-store';

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const steps: string[] = [];

  try {
    steps.push('1. Reading products...');
    const products = await readData<unknown[]>('products.json');
    steps.push(`2. Read ${products.length} products OK`);

    steps.push('3. Writing products back...');
    await writeData('products.json', products);
    steps.push('4. Write OK');

    steps.push('5. Re-reading to verify...');
    const products2 = await readData<unknown[]>('products.json');
    steps.push(`6. Re-read ${products2.length} products OK`);

    return NextResponse.json({ success: true, steps });
  } catch (error) {
    return NextResponse.json({
      success: false,
      steps,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
    }, { status: 500 });
  }
}
