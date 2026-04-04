import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'products';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'png';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Use Vercel Blob in production, local filesystem in dev
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import('@vercel/blob');
        const buffer = Buffer.from(await file.arrayBuffer());
        const blob = await put(filename, buffer, {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: file.type,
        });
        return NextResponse.json({ url: blob.url });
      } catch (blobError) {
        console.error('Vercel Blob error:', blobError);
        return NextResponse.json(
          { error: `Blob upload failed: ${blobError instanceof Error ? blobError.message : String(blobError)}` },
          { status: 500 }
        );
      }
    } else {
      // Local filesystem fallback
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.join(process.cwd(), 'public', 'uploads', folder);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const basename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filepath = path.join(dir, basename);
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filepath, buffer);
      return NextResponse.json({ url: `/uploads/${folder}/${basename}` });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    if (process.env.BLOB_READ_WRITE_TOKEN && url.includes('vercel-storage.com')) {
      const { del } = await import('@vercel/blob');
      await del(url);
    } else if (url.startsWith('/uploads/')) {
      const fs = await import('fs');
      const path = await import('path');
      const filepath = path.join(process.cwd(), 'public', url);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
