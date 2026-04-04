import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { readData, writeData } from '@/lib/data-store';
import type { Post } from '@/lib/posts';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  const posts = await readData<Post[]>('posts.json');

  if (id) {
    const post = posts.find((p) => p.id === id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json(post);
  }

  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const posts = await readData<Post[]>('posts.json');

    const excerpt = data.body
      ? data.body.replace(/[#*_`\[\]]/g, '').slice(0, 150).trim() + '...'
      : '';

    if (data.id) {
      const index = posts.findIndex((p) => p.id === data.id);
      if (index === -1) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      posts[index] = { ...posts[index], ...data, excerpt };
      await writeData('posts.json', posts);
      return NextResponse.json({ success: true, post: posts[index] });
    } else {
      const newPost: Post = {
        id: crypto.randomUUID(),
        title: data.title || 'Untitled',
        slug: data.slug || 'untitled',
        tags: data.tags || [],
        body: data.body || '',
        status: data.status || 'draft',
        date: data.date || new Date().toISOString().split('T')[0],
        excerpt,
      };
      posts.unshift(newPost);
      await writeData('posts.json', posts);
      return NextResponse.json({ success: true, post: newPost });
    }
  } catch (error) {
    console.error('Post save error:', error);
    return NextResponse.json(
      { error: `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
