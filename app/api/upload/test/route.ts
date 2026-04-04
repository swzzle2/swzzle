import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const vercelBlob = await import('@vercel/blob');
    const blob = await vercelBlob.put('test/ping.txt', 'test upload', {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'text/plain',
    });

    // Clean up
    await vercelBlob.del(blob.url);

    return NextResponse.json({
      success: true,
      message: 'Blob upload works',
      testUrl: blob.url,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
    }, { status: 500 });
  }
}
